export interface Scenario {
  id: string
  label: string
  patientId: string
  medicationIds: string[]
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
  },
  {
    id: 'scen-none',
    label: 'No documented association',
    patientId: 'patient-b',
    medicationIds: ['med-metoprolol', 'med-warfarin'],
  },
  {
    id: 'scen-insufficient',
    label: 'Insufficient evidence',
    patientId: 'patient-c',
    medicationIds: ['med-clopidogrel', 'med-omeprazole'],
  },
]
