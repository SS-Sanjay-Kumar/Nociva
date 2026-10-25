import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchLiveMedications, liveMedication, runLiveAssessment, SERVICE_DOWN_MESSAGE, toAssessRequest } from './liveApi'
import { ContractError } from '../../contracts/validate'
import { MOCK_PATIENTS } from './mocks/patients'
import liveApiSource from './liveApi.ts?raw'
import apiSource from './api.ts?raw'
import associationFound from '../../../../docs/contracts/examples/association_found.json'

afterEach(() => vi.unstubAllGlobals())

function stubFetch(impl: (url: string, init?: RequestInit) => Promise<unknown>) {
  const fn = vi.fn(impl)
  vi.stubGlobal('fetch', fn)
  return fn
}

const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => body, text: async () => '' })

const patientC = MOCK_PATIENTS.find((p) => p.id === 'patient-c')!
const meds = [liveMedication('clopidogrel'), liveMedication('omeprazole')]

describe('toAssessRequest', () => {
  it('never sends or invents a gene with no result', () => {
    const body = toAssessRequest(patientC, meds)
    const genes = body.genotypes.map((g) => g.gene)
    expect(genes).toEqual(['CYP2D6', 'CYP2C9'])
    expect(genes).not.toContain('CYP2C19')
    expect(body.medications).toEqual([
      { id: 'clopidogrel', name: 'Clopidogrel' },
      { id: 'omeprazole', name: 'Omeprazole' },
    ])
    expect(body.patientId).toBe('patient-c')
  })

  it('sends phenotype and diplotype for patient A', () => {
    const a = MOCK_PATIENTS.find((p) => p.id === 'patient-a')!
    const d6 = toAssessRequest(a, meds).genotypes.find((g) => g.gene === 'CYP2D6')
    expect(d6).toEqual({ gene: 'CYP2D6', phenotype: 'intermediate_metabolizer', diplotype: '*1/*4', activityScore: 1 })
  })
})

describe('live review adapter', () => {
  it('posts to /api/v1/review/assess and returns a validated result', async () => {
    const fetchMock = stubFetch(() => ok(associationFound))
    const result = await runLiveAssessment(patientC, meds)
    expect(result.verdict.evidenceStatus).toBe('association_found')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/v1\/review\/assess$/)
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string).genotypes.some((g: { gene: string }) => g.gene === 'CYP2C19')).toBe(false)
  })

  it('throws ContractError when the response does not match the contract', async () => {
    stubFetch(() => ok({ patientId: 'x', medications: [], generatedAt: 'now', isMock: false }))
    await expect(runLiveAssessment(patientC, meds)).rejects.toBeInstanceOf(ContractError)
  })

  it('reports a plain message when the service is unreachable, with no mock fallback', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')))
    await expect(runLiveAssessment(patientC, meds)).rejects.toMatchObject({ message: SERVICE_DOWN_MESSAGE })
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')))
    await expect(fetchLiveMedications('par')).rejects.toMatchObject({ message: SERVICE_DOWN_MESSAGE })
  })

  it('searches medications with an encoded query and validates the list', async () => {
    const fetchMock = stubFetch(() => ok([{ id: 'paroxetine', name: 'Paroxetine' }]))
    expect(await fetchLiveMedications('par x')).toEqual([{ id: 'paroxetine', name: 'Paroxetine' }])
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/review\/medications\?query=par%20x$/)
  })

  it('aborts a stale search when the caller aborts', async () => {
    stubFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
        }),
    )
    const ctl = new AbortController()
    const pending = fetchLiveMedications('p', ctl.signal)
    ctl.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('live path isolation', () => {
  it('liveApi.ts never imports mock fixtures or evaluators', () => {
    const src = liveApiSource
    const imports = [...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1])
    expect(imports.filter((i) => /mock/i.test(i))).toEqual([])
    expect(src).not.toMatch(/evaluateCombination/)
  })

  it('api.ts loads the mock evaluators only through a dynamic import', () => {
    const src = apiSource
    const staticImports = [...src.matchAll(/^import .* from\s+['"]([^'"]+)['"]/gm)].map((m) => m[1])
    expect(staticImports).not.toContain('./mockApi')
    expect(staticImports).not.toContain('./mocks/assessments')
    expect(staticImports).not.toContain('./mocks/medications')
    expect(src).toMatch(/import\('\.\/mockApi'\)/)
  })
})
