import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SmilesInputCard } from './SmilesInputCard'

function Wrapper({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <SmilesInputCard
      value="CC(=O)Oc1ccccc1C(=O)O"
      onChange={() => {}}
      onAnalyze={onAnalyze}
      onPickExample={() => {}}
      onClear={() => {}}
      loading={false}
      valid={false}
    />
  )
}

describe('SmilesInputCard keyboard submit', () => {
  it('Ctrl+Enter in the textarea calls onAnalyze', async () => {
    const user = userEvent.setup()
    const onAnalyze = vi.fn()
    render(<Wrapper onAnalyze={onAnalyze} />)

    const textarea = screen.getByLabelText(/smiles/i)
    await user.click(textarea)
    await user.keyboard('{Control>}{Enter}{/Control}')

    expect(onAnalyze).toHaveBeenCalledTimes(1)
  })

  it('Cmd (Meta)+Enter in the textarea calls onAnalyze', async () => {
    const user = userEvent.setup()
    const onAnalyze = vi.fn()
    render(<Wrapper onAnalyze={onAnalyze} />)

    const textarea = screen.getByLabelText(/smiles/i)
    await user.click(textarea)
    await user.keyboard('{Meta>}{Enter}{/Meta}')

    expect(onAnalyze).toHaveBeenCalledTimes(1)
  })

  it('plain Enter (no modifier) does NOT call onAnalyze', async () => {
    const user = userEvent.setup()
    const onAnalyze = vi.fn()
    render(<Wrapper onAnalyze={onAnalyze} />)

    const textarea = screen.getByLabelText(/smiles/i)
    await user.click(textarea)
    await user.keyboard('{Enter}')

    expect(onAnalyze).not.toHaveBeenCalled()
  })

  it('clicking "Validate and search" also calls onAnalyze', async () => {
    const user = userEvent.setup()
    const onAnalyze = vi.fn()
    render(<Wrapper onAnalyze={onAnalyze} />)

    await user.click(screen.getByRole('button', { name: /validate and search/i }))
    expect(onAnalyze).toHaveBeenCalledTimes(1)
  })
})
