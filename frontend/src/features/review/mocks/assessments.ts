import type { CheckItem, ClinicalVerdict, FlowNode, Genotype, Medication, PatientProfile } from '../../../types'

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
 * VerdictCard regardless of what `summary` says here. `recommendation` is
 * also never set here — see the field's doc comment in types/index.ts.
 */

const MOCK_LIMITATIONS = ['Demonstration fixture — not a live clinical decision.']
const ENGINE_META = { engineVersion: 'Rules engine v0.3 (demo)', evidenceSnapshot: '2026-10-20' }

/** CYP2D6 strong inhibitors in this demo's supported medication list. */
const CYP2D6_INHIBITORS = ['med-paroxetine', 'med-fluoxetine']

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

function geneNode(g: Genotype): FlowNode {
  return {
    kind: 'gene',
    label: 'Patient genotype',
    title: `${g.gene} ${g.diplotype ?? ''}`.trim(),
    sub: `${lower(g.phenotype)}${g.activityScore !== undefined ? ` · activity score ${g.activityScore.toFixed(1)}` : ''}`,
  }
}

/** Builds the per-pair check list shown when no single mechanism rule applies. */
function buildChecks(patient: PatientProfile, medicationIds: string[], medsById: Map<string, Medication>): CheckItem[] {
  const checks: CheckItem[] = []
  for (let i = 0; i < medicationIds.length; i++) {
    for (let j = i + 1; j < medicationIds.length; j++) {
      const a = medsById.get(medicationIds[i])
      const b = medsById.get(medicationIds[j])
      if (!a || !b) continue
      const genes = [...new Set([RELEVANT_GENE[medicationIds[i]], RELEVANT_GENE[medicationIds[j]]].filter(Boolean))]
      const missing = genes.some((gene) => !geneState(patient, gene))
      const note = genes.length
        ? genes
            .map((gene) => {
              const g = geneState(patient, gene)
              return g ? `${gene} ${lower(g.phenotype)}` : `${gene} not tested`
            })
            .join('  ·  ')
        : 'No relevant gene in this demo rule set'
      checks.push({ label: `${a.name} × ${b.name}`, note, missing })
    }
  }
  return checks
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
    const inhibitor = nameOf(inhibitorId)
    return {
      evidenceStatus: 'association_found',
      summary: `${inhibitor} is a strong CYP2D6 inhibitor, and tamoxifen needs CYP2D6 to form its active metabolite, endoxifen. With ${lower(d6.phenotype)} CYP2D6 status, this combination is documented to lower endoxifen formation.`,
      references: [
        {
          source: 'CPIC',
          citation: 'Goetz MP, et al. CPIC Guideline for CYP2D6 and Tamoxifen Therapy.',
          // Deep link to this specific guideline page not verified — linking
          // to the CPIC guidelines index instead of guessing a slug. This
          // index URL itself was not opened/verified in this session either.
          url: 'https://cpicpgx.org/guidelines/',
        },
        {
          source: 'FDA',
          citation: 'Table of substrates, inhibitors and inducers (drug development and drug interactions).',
          // URL not opened/verified in this session — recalled from training
          // data, not confirmed live.
          url: 'https://www.fda.gov/drugs/drug-interactions-labeling/drug-development-and-drug-interactions-table-substrates-inhibitors-and-inducers',
        },
      ],
      limitations: MOCK_LIMITATIONS,
      mechanism: [
        geneNode(d6),
        { kind: 'inhibitor', label: 'Inhibitor on list', title: inhibitor, sub: 'Strong CYP2D6 inhibitor.' },
        { kind: 'substrate', label: 'Substrate', title: 'Tamoxifen', sub: 'Converted to endoxifen by CYP2D6.' },
        { kind: 'effect', label: 'Documented effect', title: 'Lower endoxifen exposure', sub: 'Reduced formation of the active metabolite.' },
      ],
      evidenceBasis: 'Guideline-supported',
      ruleId: 'GDD-2D6-TAM-01',
      ...ENGINE_META,
    }
  }

  // Rule: CYP2D6 inhibitor + codeine -> reduced opioid activation.
  if (inhibitorId && has('med-codeine') && d6) {
    const inhibitor = nameOf(inhibitorId)
    return {
      evidenceStatus: 'association_found',
      summary: `${inhibitor} is a strong CYP2D6 inhibitor, and codeine relies on CYP2D6 to form its active opioid metabolite. With ${lower(d6.phenotype)} CYP2D6 status, the combination is documented to reduce activation.`,
      references: [
        {
          source: 'CPIC',
          citation: 'Crews KR, et al. CPIC Guideline for CYP2D6, OPRM1 and COMT Genotypes and Select Opioid Therapy.',
          // Guidelines index URL, not a verified deep link — not opened/verified in this session.
          url: 'https://cpicpgx.org/guidelines/',
        },
      ],
      limitations: MOCK_LIMITATIONS,
      mechanism: [
        geneNode(d6),
        { kind: 'inhibitor', label: 'Inhibitor on list', title: inhibitor, sub: 'Strong CYP2D6 inhibitor.' },
        { kind: 'substrate', label: 'Substrate', title: 'Codeine', sub: 'Converted to morphine by CYP2D6.' },
        { kind: 'effect', label: 'Documented effect', title: 'Reduced analgesic activation', sub: 'Less active metabolite is formed.' },
      ],
      evidenceBasis: 'Guideline-supported',
      ruleId: 'GDD-2D6-OPI-01',
      ...ENGINE_META,
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
            // Guidelines index URL, not a verified deep link — not opened/verified in this session.
            url: 'https://cpicpgx.org/guidelines/',
          },
        ],
        limitations: [...MOCK_LIMITATIONS, 'This is not a finding of no association.'],
        mechanism: [
          { kind: 'missing', label: 'Patient genotype', title: 'CYP2C19: not tested', sub: 'No result on file. The gene-dependent part of the rule cannot be evaluated.' },
          { kind: 'inhibitor', label: 'Inhibitor on list', title: 'Omeprazole', sub: 'Inhibits CYP2C19.' },
          { kind: 'substrate', label: 'Substrate', title: 'Clopidogrel', sub: 'Prodrug activated by CYP2C19.' },
          { kind: 'unknown', label: 'Documented effect', title: 'Cannot be graded', sub: 'The size of the effect depends on the missing result.' },
        ],
        missingData: ['CYP2C19 genotype or phenotype is not available for this patient.'],
        evidenceBasis: 'Incomplete input',
        ruleId: 'GDD-2C19-CLO-01',
        ...ENGINE_META,
      }
    }
    return {
      evidenceStatus: 'association_found',
      summary: `Omeprazole inhibits CYP2C19, which clopidogrel needs for activation. With ${lower(c19.phenotype)} CYP2C19 status, the combination is documented to reduce antiplatelet activation.`,
      references: [
        {
          source: 'CPIC',
          citation: 'Lee CR, et al. CPIC Guideline for CYP2C19 and Clopidogrel Therapy, 2022 update.',
          // Guidelines index URL, not a verified deep link — not opened/verified in this session.
          url: 'https://cpicpgx.org/guidelines/',
        },
      ],
      limitations: MOCK_LIMITATIONS,
      mechanism: [
        geneNode(c19),
        { kind: 'inhibitor', label: 'Inhibitor on list', title: 'Omeprazole', sub: 'Inhibits CYP2C19.' },
        { kind: 'substrate', label: 'Substrate', title: 'Clopidogrel', sub: 'Prodrug activated by CYP2C19.' },
        { kind: 'effect', label: 'Documented effect', title: 'Reduced antiplatelet activation', sub: 'Lower exposure to the active metabolite.' },
      ],
      evidenceBasis: 'Guideline-supported',
      ruleId: 'GDD-2C19-CLO-01',
      ...ENGINE_META,
    }
  }

  // Default: no curated rule matched. Render per-pair checks instead of a
  // mechanism flow, and decide "no documented association" vs. "insufficient
  // evidence" by whether a gene relevant to any selected medication is untested.
  const checks = buildChecks(patient, medicationIds, medsById)
  const anyMissing = checks.some((c) => c.missing)

  if (anyMissing) {
    return {
      evidenceStatus: 'insufficient_evidence',
      summary:
        'No curated association matched, and at least one gene needed for these medications has no result for this patient. The engine cannot tell whether an association would apply.',
      references: [{ source: 'Rule set', citation: 'Curated gene-drug-drug entries searched against the supported rule set.' }],
      limitations: MOCK_LIMITATIONS,
      checks,
      missingData: ['One or more genes relevant to these medications are not tested for this patient.'],
      evidenceBasis: 'Incomplete input',
      ruleId: '—',
      ...ENGINE_META,
    }
  }

  return {
    evidenceStatus: 'no_documented_association',
    summary:
      "No curated gene-drug-drug association matches this patient's genotype and medication list in the supported rule set.",
    references: [{ source: 'Rule set', citation: 'Curated gene-drug-drug entries searched. None matched this combination.' }],
    limitations: MOCK_LIMITATIONS,
    checks,
    evidenceBasis: 'Rule set searched',
    ruleId: '—',
    ...ENGINE_META,
  }
}
