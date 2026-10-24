import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EnginePane } from './EnginePane'
import { COPY } from '../copy'

describe('EnginePane', () => {
  it('never renders a verdict title when the engine is unreachable', () => {
    render(<EnginePane onRetry={vi.fn()} />)
    expect(screen.getByText(COPY.error.title)).toBeInTheDocument()
    expect(screen.queryByText(COPY.verdict.found.title)).not.toBeInTheDocument()
    expect(screen.queryByText(COPY.verdict.none.title)).not.toBeInTheDocument()
    expect(screen.queryByText(COPY.verdict.insufficient.title)).not.toBeInTheDocument()
  })

  it('says this is not a "no association" result', () => {
    render(<EnginePane onRetry={vi.fn()} />)
    expect(screen.getByText(/not a .*no association.* result/i)).toBeInTheDocument()
  })
})
