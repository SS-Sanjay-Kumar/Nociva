import type { AssessmentResult, EvidenceStatus } from '../types'

/**
 * DEMONSTRATION FIXTURE — hand-authored clinical verdicts.
 * These mimic the shape the teammate's deterministic rule-engine backend
 * is expected to return (see INTEGRATION.md). They are NOT computed by
 * the frontend and NOT derived from the Stream 1 ML classifier.
 */

interface MockRule {
  medicationId: string
  gene: string
  evidenceStatus: EvidenceStatus
  summary: string
  recommendation?: string
  references: { source: string; citation: string; url?: string }[]
  limitations: string[]
}

const MOCK_RULES: MockRule[] = [
  {
    medicationId: 'med-codeine',
    gene: 'CYP2D6',
    evidenceStatus: 'association_found',
    summary:
      'CYP2D6 poor metabolizer status is associated with reduced conversion of codeine to morphine, leading to diminished analgesic effect.',
    recommendation: 'Consider an alternative analgesic not primarily dependent on CYP2D6 activation.',
    references: [
      {
        source: 'CPIC',
        citation: 'Crews KR, et al. Clinical Pharmacogenetics Implementation Consortium Guideline for CYP2D6 and Codeine Therapy.',
        url: 'https://cpicpgx.org/guidelines/guideline-for-codeine-and-cyp2d6/',
      },
    ],
    limitations: [
      'Demonstration fixture — not a live clinical decision.',
      'Guideline evidence applies at a population level and may not predict individual response.',
    ],
  },
  {
    medicationId: 'med-codeine',
    gene: 'CYP2D6',
    evidenceStatus: 'association_found',
    summary:
      'CYP2D6 ultrarapid metabolizer status is associated with increased conversion of codeine to morphine, raising risk of opioid toxicity.',
    recommendation: 'Avoid codeine; consider a non-CYP2D6-dependent analgesic.',
    references: [
      {
        source: 'CPIC',
        citation: 'Crews KR, et al. Clinical Pharmacogenetics Implementation Consortium Guideline for CYP2D6 and Codeine Therapy.',
        url: 'https://cpicpgx.org/guidelines/guideline-for-codeine-and-cyp2d6/',
      },
    ],
    limitations: [
      'Demonstration fixture — not a live clinical decision.',
      'Guideline evidence applies at a population level and may not predict individual response.',
    ],
  },
  {
    medicationId: 'med-fluoxetine',
    gene: 'CYP2D6',
    evidenceStatus: 'association_found',
    summary:
      'Fluoxetine is a strong CYP2D6 inhibitor itself; phenoconversion effects can alter the metabolism of co-administered CYP2D6 substrates regardless of genotype.',
    recommendation: 'Review concomitant CYP2D6-substrate medications for phenoconversion risk.',
    references: [
      {
        source: 'FDA label',
        citation: 'Fluoxetine prescribing information, Drug Interactions section.',
      },
    ],
    limitations: ['Demonstration fixture — not a live clinical decision.'],
  },
  {
    medicationId: 'med-tamoxifen',
    gene: 'CYP2D6',
    evidenceStatus: 'association_found',
    summary:
      'CYP2D6 poor metabolizers show reduced formation of endoxifen, the active metabolite of tamoxifen, potentially reducing therapeutic efficacy.',
    recommendation: 'Consider alternative endocrine therapy or closer monitoring per CPIC guidance.',
    references: [
      {
        source: 'CPIC',
        citation: 'Goetz MP, et al. CPIC Guideline for CYP2D6 and Tamoxifen Therapy.',
        url: 'https://cpicpgx.org/guidelines/guideline-for-tamoxifen-and-cyp2d6/',
      },
    ],
    limitations: ['Demonstration fixture — not a live clinical decision.'],
  },
  {
    medicationId: 'med-metoprolol',
    gene: 'CYP2D6',
    evidenceStatus: 'insufficient_evidence',
    summary:
      'Evidence linking CYP2D6 phenotype to metoprolol clinical outcomes is mixed; dose-dependent beta-blockade effects are documented but outcome data are limited.',
    references: [
      {
        source: 'PharmGKB',
        citation: 'PharmGKB Clinical Annotation summary for metoprolol and CYP2D6.',
      },
    ],
    limitations: [
      'Demonstration fixture — not a live clinical decision.',
      'Evidence base is inconsistent across studies; confidence is low.',
    ],
  },
  {
    medicationId: 'med-omeprazole',
    gene: 'CYP2D6',
    evidenceStatus: 'no_documented_association',
    summary:
      'Omeprazole is primarily metabolized by CYP2C19, not CYP2D6. No documented CYP2D6-mediated gene-drug association was found.',
    references: [],
    limitations: ['Demonstration fixture — not a live clinical decision.'],
  },
  {
    medicationId: 'med-paracetamol',
    gene: 'CYP2D6',
    evidenceStatus: 'no_documented_association',
    summary:
      'Paracetamol is metabolized primarily via glucuronidation, sulfation, and minor CYP-mediated pathways not dominated by CYP2D6. No documented CYP2D6 association was found.',
    references: [],
    limitations: ['Demonstration fixture — not a live clinical decision.'],
  },
]

export function getMockAssessment(
  patientId: string,
  medicationId: string,
  cyp2d6Phenotype: string | undefined,
): Omit<AssessmentResult, 'medication'> {
  const rule = MOCK_RULES.find((r) => r.medicationId === medicationId)

  if (!rule) {
    return {
      patientId,
      verdict: {
        evidenceStatus: 'insufficient_evidence',
        summary: 'No pharmacogenomic rule fixture exists yet for this medication.',
        references: [],
        limitations: ['Demonstration fixture — not a live clinical decision.'],
      },
      generatedAt: new Date().toISOString(),
      isMock: true,
    }
  }

  // The codeine fixture has phenotype-dependent branches; pick the matching one.
  let summary = rule.summary
  let recommendation = rule.recommendation
  if (medicationId === 'med-codeine') {
    if (cyp2d6Phenotype === 'ultrarapid_metabolizer') {
      summary =
        'CYP2D6 ultrarapid metabolizer status is associated with increased conversion of codeine to morphine, raising risk of opioid toxicity.'
      recommendation = 'Avoid codeine; consider a non-CYP2D6-dependent analgesic.'
    } else if (cyp2d6Phenotype === 'poor_metabolizer') {
      summary =
        'CYP2D6 poor metabolizer status is associated with reduced conversion of codeine to morphine, leading to diminished analgesic effect.'
      recommendation = 'Consider an alternative analgesic not primarily dependent on CYP2D6 activation.'
    } else {
      summary = 'No strong CYP2D6-mediated effect expected for this phenotype at standard codeine dosing.'
      recommendation = undefined
    }
  }

  return {
    patientId,
    verdict: {
      evidenceStatus: rule.evidenceStatus,
      summary,
      recommendation,
      references: rule.references,
      limitations: rule.limitations,
    },
    generatedAt: new Date().toISOString(),
    isMock: true,
  }
}
