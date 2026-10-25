export interface Scenario {
  id: string
  label: string
  patientId: string
  /** Mock-mode fixture ids. */
  medicationIds: string[]
  /** Live-mode ids: the lowercase generic names the review engine uses. */
  liveMedicationIds: string[]
}

/**
 * Demo scenarios deterministically reproducing each of the three verdict
 * states, matching GENECOLLISION_HANDOFF.md section 13's demo script.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: 'scen-found',
    label: 'Association found',
    patientId: 'patient-a',
    medicationIds: ['med-paroxetine', 'med-tamoxifen'],
    liveMedicationIds: ['paroxetine', 'tamoxifen'],
  },
  {
    id: 'scen-none',
    label: 'No documented association',
    patientId: 'patient-b',
    medicationIds: ['med-metoprolol', 'med-warfarin'],
    liveMedicationIds: ['metoprolol', 'warfarin'],
  },
  {
    id: 'scen-insufficient',
    label: 'Insufficient evidence',
    patientId: 'patient-c',
    medicationIds: ['med-clopidogrel', 'med-omeprazole'],
    liveMedicationIds: ['clopidogrel', 'omeprazole'],
  },
]
