import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { expectNoA11yViolations } from '../../testing/a11y'
import { IdlePane } from './components/IdlePane'
import { EnginePane } from './components/EnginePane'
import { VerdictCard } from './components/VerdictCard'
import { MechanismCard } from './components/MechanismCard'
import { EvidenceCard } from './components/EvidenceCard'
import { LimitsCard } from './components/LimitsCard'
import { MOCK_PATIENTS } from './mocks/patients'
import type { AssessmentResult } from '../../types'
import associationFound from '../../../../docs/contracts/examples/association_found.json'
import noDocumentedAssociation from '../../../../docs/contracts/examples/no_documented_association.json'
import insufficientEvidence from '../../../../docs/contracts/examples/insufficient_evidence.json'

function ResultPane({ result }: { result: AssessmentResult }) {
  const patient = MOCK_PATIENTS.find((p) => p.id === result.patientId)!
  return (
    <div>
      <VerdictCard result={result} patient={patient} />
      <MechanismCard mechanism={result.verdict.mechanism} checks={result.verdict.checks} />
      <EvidenceCard references={result.verdict.references} />
      <LimitsCard missingData={result.verdict.missingData} limitations={result.verdict.limitations} />
    </div>
  )
}

describe('Medication Review accessibility (axe)', () => {
  it('idle state has no violations', async () => {
    const { container } = render(<IdlePane />)
    await expectNoA11yViolations(container)
  })

  it('association_found state has no violations', async () => {
    const { container } = render(<ResultPane result={associationFound as unknown as AssessmentResult} />)
    await expectNoA11yViolations(container)
  })

  it('no_documented_association state has no violations', async () => {
    const { container } = render(<ResultPane result={noDocumentedAssociation as unknown as AssessmentResult} />)
    await expectNoA11yViolations(container)
  })

  it('insufficient_evidence state has no violations', async () => {
    const { container } = render(<ResultPane result={insufficientEvidence as unknown as AssessmentResult} />)
    await expectNoA11yViolations(container)
  })

  it('error (engine unreachable) state has no violations', async () => {
    const { container } = render(<EnginePane onRetry={() => {}} />)
    await expectNoA11yViolations(container)
  })
})
