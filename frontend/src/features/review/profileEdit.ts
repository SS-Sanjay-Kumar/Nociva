import type { Genotype, PatientProfile, Phenotype } from '../../types'

export const EDITABLE_GENES = ['CYP2D6', 'CYP2C19', 'CYP2C9', 'CYP3A5'] as const

/** Phenotype strings the engine and patient fixtures already use, per gene. Never invented here. */
export const PHENOTYPES_BY_GENE: Record<string, Phenotype[]> = {
  CYP2D6: ['poor_metabolizer', 'intermediate_metabolizer', 'normal_metabolizer', 'ultrarapid_metabolizer'],
  CYP2C19: ['poor_metabolizer', 'intermediate_metabolizer', 'normal_metabolizer', 'rapid_metabolizer', 'ultrarapid_metabolizer'],
  CYP2C9: ['poor_metabolizer', 'intermediate_metabolizer', 'normal_metabolizer'],
  CYP3A5: ['non_expresser', 'intermediate_metabolizer', 'normal_metabolizer'],
}

export const DIPLOTYPE_MAX = 24
export const DIPLOTYPE_PATTERN = /^[A-Za-z0-9*/+.-]*$/

export const PROFILE_COPY = {
  driver:
    'The phenotype you select drives the assessment. Diplotype and activity score are labels only; Nociva does not infer a phenotype from them.',
  synthetic: 'Synthetic input only. Do not enter real patient data.',
  mockDisabled: 'Editing profiles needs the live review engine',
} as const

export function phenotypeText(p: string) {
  return p.replaceAll('_', ' ')
}

/** One entry per editable gene, taken from the preset. Untested genes are marked missing. */
export function draftFromPatient(patient: PatientProfile): Genotype[] {
  return EDITABLE_GENES.map((gene) => {
    const g = patient.genotypes.find((x) => x.gene === gene)
    return g && !g.missing && g.phenotype ? { ...g } : { gene, missing: true }
  })
}

export function genotypesKey(genotypes: Genotype[]): string {
  return JSON.stringify(genotypes.map((g) => [g.gene, g.missing ? null : g.phenotype, g.diplotype ?? null, g.activityScore ?? null]))
}
