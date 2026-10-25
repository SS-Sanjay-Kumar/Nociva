import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import associationFound from '../../../../docs/contracts/examples/association_found.json'

vi.mock('../../lib/config', async (orig) => ({
  ...(await orig<typeof import('../../lib/config')>()),
  MEDICATION_REVIEW_MOCK_MODE: false,
  REVIEW_MODE: 'live',
}))

import { MemoryRouter } from 'react-router-dom'
import { ReviewPage } from './ReviewPage'

afterEach(() => {
  vi.unstubAllGlobals()
  genesFail = false
})

let genesFail = false
const GENES = [
  { gene: 'CYP2C19', guidelineCount: 3 },
  { gene: 'CYP2D6', guidelineCount: 9 },
]

function stub() {
  const fn = vi.fn(async (url: string, _init?: RequestInit): Promise<unknown> => {
    if (String(url).includes('/genes')) {
      if (genesFail) throw new TypeError('network')
      return { ok: true, status: 200, json: async () => GENES, text: async () => '' }
    }
    const body = String(url).includes('/assess') ? { ...associationFound, patientId: 'patient-a' } : []
    return { ok: true, status: 200, json: async () => body, text: async () => '' }
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

const lastAssess = (fn: ReturnType<typeof stub>) => {
  const call = [...fn.mock.calls].reverse().find((c) => String(c[0]).includes('/assess'))!
  return JSON.parse((call[1] as RequestInit).body as string)
}

describe('ReviewPage editable profile (live)', () => {
  it('sends the edited phenotype, marks the result stale, and discards edits on patient change', async () => {
    const fn = stub()
    render(<MemoryRouter><ReviewPage /></MemoryRouter>)
    await screen.findByLabelText('CYP2C19 phenotype')
    await userEvent.click(screen.getByRole('button', { name: /Run assessment/i }))
    await screen.findAllByText(/Association found/i)
    expect(screen.queryByText('Inputs changed. Run assessment again.')).toBeNull()

    await userEvent.selectOptions(screen.getByLabelText('CYP2C19 phenotype'), '')
    expect(await screen.findByText('Inputs changed. Run assessment again.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Run assessment/i }))
    await waitFor(() => expect(screen.queryByText('Inputs changed. Run assessment again.')).toBeNull())
    const sent = lastAssess(fn).genotypes.map((g: { gene: string }) => g.gene)
    expect(sent).not.toContain('CYP2C19')
    expect(sent).toContain('CYP2D6')

    await userEvent.click(screen.getByRole('radio', { name: /Patient B/ }))
    expect(screen.getByLabelText('CYP2C19 phenotype')).toHaveValue('normal_metabolizer')
    expect(screen.queryByText('Custom profile (edited)')).toBeNull()
  })

  it('renders one row per gene returned by the genes endpoint', async () => {
    stub()
    render(<MemoryRouter><ReviewPage /></MemoryRouter>)
    await screen.findByLabelText('CYP2C19 phenotype')
    expect(screen.getByLabelText('CYP2D6 phenotype')).toBeInTheDocument()
    expect(screen.queryByLabelText('CYP2C9 phenotype')).toBeNull()
    expect(screen.queryByLabelText('CYP3A5 phenotype')).toBeNull()
    expect(screen.queryByText(/Gene list could not be loaded/)).toBeNull()
  })

  it('shows a notice and falls back to the built-in genes when the genes request fails', async () => {
    genesFail = true
    stub()
    render(<MemoryRouter><ReviewPage /></MemoryRouter>)
    expect(await screen.findByText(/Gene list could not be loaded from the service/)).toBeInTheDocument()
    for (const gene of ['CYP2D6', 'CYP2C19', 'CYP2C9', 'CYP3A5']) {
      expect(screen.getByLabelText(`${gene} phenotype`)).toBeInTheDocument()
    }
  })
})
