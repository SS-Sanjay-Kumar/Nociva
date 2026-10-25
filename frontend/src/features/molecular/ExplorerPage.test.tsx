import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExplorerPage } from './ExplorerPage'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ExplorerPage service-unavailable state', () => {
  it('renders "Molecular service unavailable" with a start command when the backend cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('fetch failed')),
    )

    render(<ExplorerPage />)

    expect(await screen.findByText(/molecular service unavailable/i)).toBeInTheDocument()
    expect(screen.getByText(/uvicorn app\.main:app/)).toBeInTheDocument()
  })
})
