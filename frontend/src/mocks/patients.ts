import type { PatientProfile } from '../types'

/**
 * DEMONSTRATION FIXTURE — synthetic patient profiles only.
 * No real patient data. Genotype/phenotype pairings follow CPIC-style
 * nomenclature but are illustrative, not derived from a real individual.
 */
export const MOCK_PATIENTS: PatientProfile[] = [
  {
    id: 'patient-a',
    label: 'Synthetic Patient A',
    age: 54,
    sex: 'female',
    genotypes: [
      { gene: 'CYP2D6', diplotype: '*4/*4', phenotype: 'poor_metabolizer' },
      { gene: 'CYP2C19', diplotype: '*1/*1', phenotype: 'normal_metabolizer' },
    ],
    notes: 'Synthetic profile for demonstration purposes only.',
  },
  {
    id: 'patient-b',
    label: 'Synthetic Patient B',
    age: 31,
    sex: 'male',
    genotypes: [
      { gene: 'CYP2D6', diplotype: '*1/*2', phenotype: 'normal_metabolizer' },
      { gene: 'CYP2C19', diplotype: '*2/*2', phenotype: 'poor_metabolizer' },
    ],
    notes: 'Synthetic profile for demonstration purposes only.',
  },
  {
    id: 'patient-c',
    label: 'Synthetic Patient C',
    age: 68,
    sex: 'other',
    genotypes: [
      { gene: 'CYP2D6', diplotype: '*1/*1xN', phenotype: 'ultrarapid_metabolizer' },
      { gene: 'CYP2C19', diplotype: '*1/*17', phenotype: 'rapid_metabolizer' },
    ],
    notes: 'Synthetic profile for demonstration purposes only.',
  },
]
