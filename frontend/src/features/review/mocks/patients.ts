import type { PatientProfile } from '../../../types'

/**
 * DEMONSTRATION FIXTURE — synthetic patient profiles only.
 * No real patient data. Genotype/phenotype pairings follow CPIC-style
 * nomenclature but are illustrative, not derived from a real individual.
 */
export const MOCK_PATIENTS: PatientProfile[] = [
  {
    id: 'patient-a',
    label: 'Synthetic Patient A',
    age: 58,
    sex: 'female',
    context: 'Adjuvant breast cancer therapy',
    genotypes: [
      { gene: 'CYP2D6', diplotype: '*1/*4', phenotype: 'intermediate_metabolizer', activityScore: 1.0 },
      { gene: 'CYP2C19', diplotype: '*1/*2', phenotype: 'intermediate_metabolizer' },
      { gene: 'CYP2C9', diplotype: '*1/*1', phenotype: 'normal_metabolizer' },
      { gene: 'CYP3A5', diplotype: '*3/*3', phenotype: 'non_expresser' },
    ],
    notes: 'Synthetic profile for demonstration purposes only.',
  },
  {
    id: 'patient-b',
    label: 'Synthetic Patient B',
    age: 44,
    sex: 'male',
    context: 'Atrial fibrillation',
    genotypes: [
      { gene: 'CYP2D6', diplotype: '*1/*2', phenotype: 'normal_metabolizer', activityScore: 2.0 },
      { gene: 'CYP2C19', diplotype: '*1/*1', phenotype: 'normal_metabolizer' },
      { gene: 'CYP2C9', diplotype: '*1/*1', phenotype: 'normal_metabolizer' },
      { gene: 'CYP3A5', diplotype: '*3/*3', phenotype: 'non_expresser' },
    ],
    notes: 'Synthetic profile for demonstration purposes only.',
  },
  {
    id: 'patient-c',
    label: 'Synthetic Patient C',
    age: 67,
    sex: 'female',
    context: 'Recent coronary stent, reflux',
    genotypes: [
      { gene: 'CYP2D6', diplotype: '*1/*1', phenotype: 'normal_metabolizer', activityScore: 2.0 },
      { gene: 'CYP2C19', missing: true },
      { gene: 'CYP2C9', diplotype: '*1/*3', phenotype: 'intermediate_metabolizer' },
      { gene: 'CYP3A5', missing: true },
    ],
    notes: 'Synthetic profile for demonstration purposes only.',
  },
]
