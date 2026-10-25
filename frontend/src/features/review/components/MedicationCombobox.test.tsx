import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MedicationCombobox } from './MedicationCombobox'
import { MOCK_MEDICATIONS } from '../mocks/medications'

function setup() {
  const onAdd = vi.fn()
  render(<MedicationCombobox medications={MOCK_MEDICATIONS} selectedIds={[]} onAdd={onAdd} />)
  const input = screen.getByRole('combobox', { name: /search medications/i })
  return { onAdd, input }
}

describe('MedicationCombobox keyboard flow', () => {
  it('opens the listbox on typing and filters to matching medications', async () => {
    const user = userEvent.setup()
    const { input } = setup()

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    await user.type(input, 'paroxetine')

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /paroxetine/i })).toBeInTheDocument()
  })

  it('moves the highlighted option with ArrowDown and adds that option (not the first) on Enter', async () => {
    const user = userEvent.setup()
    const { input, onAdd } = setup()

    // "CYP2D6" matches several drugClass strings; fixture order is
    // Paroxetine, Tamoxifen, Metoprolol, Codeine, Fluoxetine -- so
    // ArrowDown once should move the highlight from Paroxetine to Tamoxifen.
    await user.type(input, 'CYP2D6')
    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThanOrEqual(2)
    expect(options[0]).toHaveAccessibleName(/paroxetine/i)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowDown}')
    expect(options[0]).toHaveAttribute('aria-selected', 'false')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAccessibleName(/tamoxifen/i)

    await user.keyboard('{Enter}')

    const tamoxifen = MOCK_MEDICATIONS.find((m) => m.name === 'Tamoxifen')!
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith(tamoxifen.id)
  })

  it('Enter adds the single matching medication when the query narrows to one', async () => {
    const user = userEvent.setup()
    const { input, onAdd } = setup()

    await user.type(input, 'tamoxifen')
    expect(screen.getAllByRole('option')).toHaveLength(1)

    await user.keyboard('{Enter}')
    const tamoxifen = MOCK_MEDICATIONS.find((m) => m.name === 'Tamoxifen')!
    expect(onAdd).toHaveBeenCalledWith(tamoxifen.id)
  })

  it('clears the query after adding, and Backspace edits the field normally', async () => {
    const user = userEvent.setup()
    const { input, onAdd } = setup()

    await user.type(input, 'tamoxifen')
    await user.keyboard('{Enter}')
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(input).toHaveValue('')

    await user.type(input, 'warfarin')
    expect(input).toHaveValue('warfarin')
    await user.keyboard('{Backspace}{Backspace}')
    expect(input).toHaveValue('warfar')
  })

  it('Escape closes the listbox without adding anything', async () => {
    const user = userEvent.setup()
    const { input, onAdd } = setup()

    await user.type(input, 'warfarin')
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })
})
