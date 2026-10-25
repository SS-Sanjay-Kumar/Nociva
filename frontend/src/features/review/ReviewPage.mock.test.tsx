import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ReviewPage } from './ReviewPage'

describe('ReviewPage profile editing (mock mode)', () => {
  it('shows the disabled note and no editable controls', async () => {
    render(<MemoryRouter><ReviewPage /></MemoryRouter>)
    expect(await screen.findByText('Editing profiles needs the live review engine')).toBeInTheDocument()
    expect(screen.queryByLabelText('CYP2C19 phenotype')).toBeNull()
  })
})
