import type { Genotype, PatientProfile, Phenotype } from '../../types'

/** Built-in supported genes, used only when the genes endpoint cannot be loaded (and the page says so). */
export const EDITABLE_GENES = ['CYP2D6', 'CYP2C19', 'CYP2C9', 'CYP3A5'] as const

/** The one non-preset phenotype offered per gene. CYP3A5 has no intermediate wording in fixtures or engine, so "intermediate expresser". */
export const INTERMEDIATE_BY_GENE: Record<string, Phenotype> = {
  CYP2D6: 'intermediate_metabolizer',
  CYP2C19: 'intermediate_metabolizer',
  CYP2C9: 'intermediate_metabolizer',
  CYP3A5: 'intermediate_expresser',
}

export const DIPLOTYPE_MAX = 24
export const DIPLOTYPE_PATTERN = /^[A-Za-z0-9*/+.-]*$/

export const PROFILE_COPY = {
  driver:
    'The phenotype you select drives the assessment. Diplotype and activity score are labels only; Nociva does not infer a phenotype from them.',
  synthetic: 'Synthetic input only. Do not enter real patient data.',
  mockDisabled: 'Editing profiles needs the live review engine',
  genesFailed: 'Gene list could not be loaded from the service',
} as const

export function phenotypeText(p: string) {
  return p.replaceAll('_', ' ')
}

export interface PhenotypeOption {
  value: string
  label: string
}

/** "Not tested", the intermediate phenotype for the gene, and the patient's own preset if it differs. Nothing else. */
export function phenotypeOptions(gene: string, preset: Genotype | undefined): PhenotypeOption[] {
  const intermediate = INTERMEDIATE_BY_GENE[gene]
  const options: PhenotypeOption[] = [{ value: '', label: 'Not tested' }]
  if (intermediate) options.push({ value: intermediate, label: phenotypeText(intermediate) })
  if (preset && !preset.missing && preset.phenotype && preset.phenotype !== intermediate) {
    options.push({ value: preset.phenotype, label: `Preset: ${phenotypeText(preset.phenotype)}` })
  }
  return options
}

/** Preset genotypes, plus a "Not tested" row for any listed gene the preset lacks. Genes outside the list are kept untouched. */
export function draftFromPatient(patient: PatientProfile, genes: readonly string[]): Genotype[] {
  const out = patient.genotypes.map((g) => ({ ...g }))
  for (const gene of genes) {
    if (!out.some((g) => g.gene === gene)) out.push({ gene, missing: true })
  }
  return out
}

export function genotypesKey(genotypes: Genotype[]): string {
  return JSON.stringify(genotypes.map((g) => [g.gene, g.missing ? null : g.phenotype, g.diplotype ?? null, g.activityScore ?? null]))
}
