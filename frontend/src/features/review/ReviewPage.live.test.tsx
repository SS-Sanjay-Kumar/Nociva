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

afterEach(() => vi.unstubAllGlobals())

function stub() {
  const fn = vi.fn(async (url: string, _init?: RequestInit) => {
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

    await userEvent.selectOptions(screen.getByLabelText('CYP2C19 phenotype'), 'poor_metabolizer')
    expect(await screen.findByText('Inputs changed. Run assessment again.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Run assessment/i }))
    await waitFor(() => expect(screen.queryByText('Inputs changed. Run assessment again.')).toBeNull())
    const c19 = lastAssess(fn).genotypes.find((g: { gene: string }) => g.gene === 'CYP2C19')
    expect(c19.phenotype).toBe('poor_metabolizer')

    await userEvent.click(screen.getByRole('radio', { name: /Patient B/ }))
    expect(screen.getByLabelText('CYP2C19 phenotype')).toHaveValue('normal_metabolizer')
    expect(screen.queryByText('Custom profile (edited)')).toBeNull()
  })
})
