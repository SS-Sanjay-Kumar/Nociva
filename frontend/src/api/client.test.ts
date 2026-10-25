import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { apiRequest } from './client'
import { ContractError } from '../contracts/validate'

afterEach(() => {
  vi.unstubAllGlobals()
})

const Schema = z.object({ id: z.string(), count: z.number() })

function mockFetchJson(body: unknown, ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: async () => body,
      text: async () => JSON.stringify(body),
    }),
  )
}

describe('apiRequest schema validation at the API boundary', () => {
  it('returns the parsed data when the response matches the schema', async () => {
    mockFetchJson({ id: 'a', count: 1 })
    const data = await apiRequest('/x', {}, Schema)
    expect(data).toEqual({ id: 'a', count: 1 })
  })

  it('throws ContractError when a required field is missing', async () => {
    mockFetchJson({ id: 'a' })
    await expect(apiRequest('/x', {}, Schema)).rejects.toBeInstanceOf(ContractError)
  })

  it('strips unknown fields rather than failing', async () => {
    mockFetchJson({ id: 'a', count: 1, extra: 'ignore me' })
    const data = await apiRequest('/x', {}, Schema)
    expect(data).not.toHaveProperty('extra')
  })

  it('skips validation entirely when no schema is passed', async () => {
    mockFetchJson({ anything: 'goes' })
    const data = await apiRequest('/x')
    expect(data).toEqual({ anything: 'goes' })
  })
})
