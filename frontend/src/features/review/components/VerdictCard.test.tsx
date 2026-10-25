import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VerdictCard } from './VerdictCard'
import { COPY } from '../copy'
import type { AssessmentResult, PatientProfile } from '../../../types'

const patient: PatientProfile = {
  id: 'patient-a',
  label: 'Synthetic Patient A',
  age: 58,
  sex: 'female',
  genotypes: [{ gene: 'CYP2D6', diplotype: '*1/*4', phenotype: 'intermediate_metabolizer', activityScore: 1.0 }],
}

function makeResult(evidenceStatus: AssessmentResult['verdict']['evidenceStatus']): AssessmentResult {
  return {
    patientId: patient.id,
    medications: [{ id: 'med-x', name: 'Drug X' }],
    verdict: {
      evidenceStatus,
      summary: 'Fixture summary text.',
      references: [],
      limitations: [],
    },
    generatedAt: new Date().toISOString(),
    isMock: true,
  }
}

describe('VerdictCard safety callouts', () => {
  it('always renders the hard-coded "not a safety finding" callout for no_documented_association', () => {
    render(<VerdictCard result={makeResult('no_documented_association')} patient={patient} />)
    expect(screen.getByText(COPY.verdict.none.callout.split('.')[0], { exact: false })).toBeInTheDocument()
  })

  it('always renders the hard-coded "unresolved is not reassurance" callout for insufficient_evidence', () => {
    render(<VerdictCard result={makeResult('insufficient_evidence')} patient={patient} />)
    expect(screen.getByText(COPY.verdict.insufficient.callout.split('.')[0], { exact: false })).toBeInTheDocument()
  })

  it('does not render a safety callout for association_found', () => {
    render(<VerdictCard result={makeResult('association_found')} patient={patient} />)
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  it.each(['association_found', 'no_documented_association', 'insufficient_evidence'] as const)(
    'never puts a green/emerald/lime class on the %s verdict card',
    (status) => {
      const { container } = render(<VerdictCard result={makeResult(status)} patient={patient} />)
      expect(container.innerHTML).not.toMatch(/emerald|\bgreen\b|\blime\b/i)
    },
  )
})
