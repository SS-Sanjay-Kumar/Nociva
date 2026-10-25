import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expectNoA11yViolations } from '../../../testing/a11y'
import { ProfileEditor } from './ProfileEditor'
import { draftFromPatient, PROFILE_COPY } from '../profileEdit'
import { toAssessRequest, liveMedication } from '../liveApi'
import { MOCK_PATIENTS } from '../mocks/patients'
import type { Genotype } from '../../../types'

const GENES = ['CYP2C19', 'CYP2C9', 'CYP2D6', 'CYP3A5']
const patientC = MOCK_PATIENTS.find((p) => p.id === 'patient-c')!
const meds = [liveMedication('clopidogrel'), liveMedication('omeprazole')]

/** Stateful harness mirroring ReviewPage: preset until edited. */
function Harness({ onDraft }: { onDraft?: (g: Genotype[]) => void }) {
  const [draft, setDraft] = React.useState<Genotype[] | null>(null)
  const current = draft ?? draftFromPatient(patientC, GENES)
  onDraft?.(current)
  return (
    <ProfileEditor
      genotypes={current}
      genes={GENES}
      preset={patientC.genotypes}
      edited={draft !== null}
      onChange={(gene, patch) => setDraft((prev) => (prev ?? draftFromPatient(patientC, GENES)).map((g) => (g.gene === gene ? { ...g, ...patch } : g)))}
      onReset={() => setDraft(null)}
    />
  )
}
import * as React from 'react'

const payload = (genotypes: Genotype[]) => toAssessRequest({ ...patientC, genotypes }, meds).genotypes

afterEach(() => vi.unstubAllGlobals())

describe('ProfileEditor', () => {
  it('changing a select updates the request payload', async () => {
    let g: Genotype[] = []
    render(<Harness onDraft={(d) => (g = d)} />)
    await userEvent.selectOptions(screen.getByLabelText('CYP2C19 phenotype'), 'intermediate_metabolizer')
    expect(payload(g).find((x) => x.gene === 'CYP2C19')).toEqual({ gene: 'CYP2C19', phenotype: 'intermediate_metabolizer' })
    expect(screen.getByText('Custom profile (edited)')).toBeInTheDocument()
  })

  it('"Not tested" omits the gene', async () => {
    let g: Genotype[] = []
    render(<Harness onDraft={(d) => (g = d)} />)
    await userEvent.selectOptions(screen.getByLabelText('CYP2C9 phenotype'), '')
    expect(payload(g).map((x) => x.gene)).toEqual(['CYP2D6'])
  })

  const labels = (name: string) => within(screen.getByLabelText(name)).getAllByRole('option').map((o) => o.textContent)

  it('offers exactly Not tested, intermediate, and a differing preset', () => {
    render(<Harness />)
    expect(labels('CYP2C19 phenotype')).toEqual(['Not tested', 'intermediate metabolizer'])
    expect(labels('CYP2C9 phenotype')).toEqual(['Not tested', 'intermediate metabolizer'])
    expect(labels('CYP2D6 phenotype')).toEqual(['Not tested', 'intermediate metabolizer', 'Preset: normal metabolizer'])
    expect(labels('CYP3A5 phenotype')).toEqual(['Not tested', 'intermediate expresser'])
  })

  it('changing a gene to intermediate puts the exact string in the payload', async () => {
    let g: Genotype[] = []
    render(<Harness onDraft={(d) => (g = d)} />)
    await userEvent.selectOptions(screen.getByLabelText('CYP3A5 phenotype'), 'intermediate_expresser')
    expect(payload(g).find((x) => x.gene === 'CYP3A5')?.phenotype).toBe('intermediate_expresser')
  })

  it('rejects bad diplotype characters', () => {
    render(<Harness />)
    const input = screen.getByLabelText(/CYP2D6 diplotype/)
    fireEvent.change(input, { target: { value: '*1/*4' } })
    expect(input).toHaveValue('*1/*4')
    fireEvent.change(input, { target: { value: '*1/*4<script>' } })
    expect(input).toHaveValue('*1/*4')
    expect(screen.getByRole('alert')).toHaveTextContent(/letters, digits/)
  })

  it('reset restores the preset', async () => {
    render(<Harness />)
    const select = screen.getByLabelText('CYP2D6 phenotype')
    expect(select).toHaveValue('normal_metabolizer')
    await userEvent.selectOptions(select, 'intermediate_metabolizer')
    await userEvent.click(screen.getByRole('button', { name: 'Reset to preset' }))
    expect(screen.getByLabelText('CYP2D6 phenotype')).toHaveValue('normal_metabolizer')
    expect(screen.queryByText('Custom profile (edited)')).toBeNull()
  })

  it('never derives a phenotype from a diplotype', async () => {
    let g: Genotype[] = []
    render(<Harness onDraft={(d) => (g = d)} />)
    await userEvent.selectOptions(screen.getByLabelText('CYP2D6 phenotype'), 'normal_metabolizer')
    fireEvent.change(screen.getByLabelText(/CYP2D6 diplotype/), { target: { value: '*4/*4' } })
    expect(payload(g).find((x) => x.gene === 'CYP2D6')).toMatchObject({ phenotype: 'normal_metabolizer', diplotype: '*4/*4' })
    // diplotype typed while untested still does not create a phenotype
    fireEvent.change(screen.getByLabelText(/CYP2C19 diplotype/), { target: { value: '*2/*2' } })
    expect(payload(g).map((x) => x.gene)).not.toContain('CYP2C19')
  })

  it('shows the honesty notes and has no axe violations', async () => {
    const { container } = render(<Harness />)
    expect(screen.getByText(PROFILE_COPY.driver)).toBeInTheDocument()
    expect(screen.getByText(PROFILE_COPY.synthetic)).toBeInTheDocument()
    await expectNoA11yViolations(container)
  })
})
