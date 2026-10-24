import type { ClinicalVerdict, Genotype, Medication, PatientProfile } from '../../../types'

/**
 * DEMONSTRATION FIXTURE — hand-authored, deterministic gene-drug-drug rule
 * stand-in. Mimics the shape the teammate's real rule-engine backend is
 * expected to return (see INTEGRATION.md): one verdict for the WHOLE
 * selected medication list, not one per drug. NOT computed from the
 * Stream 1 ML classifier.
 *
 * NOTE: the hard safety callouts for `no_documented_association` and
 * `insufficient_evidence` are NOT read from this file — they are
 * hard-coded in features/review/copy.ts and rendered unconditionally by
 * VerdictCard regardless of what `summary` says here.
 */

const MOCK_LIMITATIONS = ['Demonstration fixture — not a live clinical decision.']

/** CYP2D6 strong inhibitors in this demo's supported medication list. */
const CYP2D6_INHIBITORS = ['med-paroxetine', 'med-fluoxetine']
/** Medications requiring CYP2D6 activation for their documented effect. */
const CYP2D6_PRODRUGS = ['med-tamoxifen', 'med-codeine']

/** Each medication's gene relevant to interaction checks in this demo, if any. */
const RELEVANT_GENE: Record<string, string> = {
  'med-paroxetine': 'CYP2D6',
  'med-fluoxetine': 'CYP2D6',
  'med-tamoxifen': 'CYP2D6',
  'med-codeine': 'CYP2D6',
  'med-metoprolol': 'CYP2D6',
  'med-warfarin': 'CYP2C9',
  'med-clopidogrel': 'CYP2C19',
  'med-omeprazole': 'CYP2C19',
}

function geneState(patient: PatientProfile, gene: string): Genotype | null {
  const g = patient.genotypes.find((x) => x.gene === gene)
  return g && !g.missing ? g : null
}

function lower(phenotype?: string) {
  return (phenotype ?? '').replaceAll('_', ' ')
}

export function evaluateCombination(
  patient: PatientProfile,
  medicationIds: string[],
  medsById: Map<string, Medication>,
): ClinicalVerdict {
  const has = (id: string) => medicationIds.includes(id)
  const nameOf = (id: string) => medsById.get(id)?.name ?? id

  const d6 = geneState(patient, 'CYP2D6')
  const c19 = geneState(patient, 'CYP2C19')

  // Rule: CYP2D6 inhibitor + tamoxifen -> reduced endoxifen formation.
  const inhibitorId = CYP2D6_INHIBITORS.find(has)
  if (inhibitorId && has('med-tamoxifen') && d6) {
    return {
      evidenceStatus: 'association_found',
      summary: `${nameOf(inhibitorId)} is a strong CYP2D6 inhibitor, and tamoxifen needs CYP2D6 to form its active metabolite, endoxifen. With ${lower(d6.phenotype)} CYP2D6 status, this combination is documented to lower endoxifen formation.`,
      recommendation: 'Consider alternative endocrine therapy or closer monitoring per CPIC guidance.',
      references: [
        {
          source: 'CPIC',
          citation: 'Goetz MP, et al. CPIC Guideline for CYP2D6 and Tamoxifen Therapy.',
          url: 'https://cpicpgx.org/guidelines/guideline-for-tamoxifen-and-cyp2d6/',
        },
        {
          source: 'FDA',
          citation: 'Table of substrates, inhibitors and inducers (drug development and drug interactions).',
        },
      ],
      limitations: MOCK_LIMITATIONS,
    }
  }

  // Rule: CYP2D6 inhibitor + an opioid CYP2D6 prodrug -> reduced activation.
  const opioidId = CYP2D6_PRODRUGS.find((id) => id === 'med-codeine' && has(id))
  if (inhibitorId && opioidId && d6) {
    return {
      evidenceStatus: 'association_found',
      summary: `${nameOf(inhibitorId)} is a strong CYP2D6 inhibitor, and ${nameOf(opioidId).toLowerCase()} relies on CYP2D6 to form its active opioid metabolite. With ${lower(d6.phenotype)} CYP2D6 status, the combination is documented to reduce activation.`,
      recommendation: 'Consider an alternative analgesic not primarily dependent on CYP2D6 activation.',
      references: [
        {
          source: 'CPIC',
          citation: 'Crews KR, et al. CPIC Guideline for CYP2D6, OPRM1 and COMT Genotypes and Select Opioid Therapy.',
          url: 'https://cpicpgx.org/guidelines/guideline-for-codeine-and-cyp2d6/',
        },
      ],
      limitations: MOCK_LIMITATIONS,
    }
  }

  // Rule: clopidogrel (CYP2C19 prodrug) + omeprazole (CYP2C19 inhibitor).
  if (has('med-clopidogrel') && has('med-omeprazole')) {
    if (!c19) {
      return {
        evidenceStatus: 'insufficient_evidence',
        summary:
          'A drug-drug association between omeprazole and clopidogrel is documented, but this patient has no CYP2C19 result. The engine cannot assess how their genotype changes it.',
        references: [
          {
            source: 'CPIC',
            citation: 'Lee CR, et al. CPIC Guideline for CYP2C19 and Clopidogrel Therapy, 2022 update.',
            url: 'https://cpicpgx.org/guidelines/guideline-for-clopidogrel-and-cyp2c19/',
          },
        ],
        limitations: [...MOCK_LIMITATIONS, 'This is not a finding of no association.'],
      }
    }
    return {
      evidenceStatus: 'association_found',
      summary: `Omeprazole inhibits CYP2C19, which clopidogrel needs for activation. With ${lower(c19.phenotype)} CYP2C19 status, the combination is documented to reduce antiplatelet activation.`,
      recommendation: 'Review for an alternative proton pump inhibitor with weaker CYP2C19 inhibition.',
      references: [
        {
          source: 'CPIC',
          citation: 'Lee CR, et al. CPIC Guideline for CYP2C19 and Clopidogrel Therapy, 2022 update.',
          url: 'https://cpicpgx.org/guidelines/guideline-for-clopidogrel-and-cyp2c19/',
        },
      ],
      limitations: MOCK_LIMITATIONS,
    }
  }

  // Default: no curated rule matched. Check whether a gene relevant to any
  // selected medication has no result for this patient before concluding
  // "no documented association" vs. "insufficient evidence".
  const relevantGenes = [...new Set(medicationIds.map((id) => RELEVANT_GENE[id]).filter(Boolean))]
  const missingGene = relevantGenes.some((gene) => !geneState(patient, gene))

  if (missingGene) {
    return {
      evidenceStatus: 'insufficient_evidence',
      summary:
        'No curated association matched, and at least one gene needed for these medications has no result for this patient. The engine cannot tell whether an association would apply.',
      references: [
        {
          source: 'Rule set',
          citation: 'Curated gene-drug-drug entries searched against the supported rule set.',
        },
      ],
      limitations: MOCK_LIMITATIONS,
    }
  }

  return {
    evidenceStatus: 'no_documented_association',
    summary:
      "No curated gene-drug-drug association matches this patient's genotype and medication list in the supported rule set.",
    references: [
      {
        source: 'Rule set',
        citation: 'Curated gene-drug-drug entries searched. None matched this combination.',
      },
    ],
    limitations: MOCK_LIMITATIONS,
  }
}
