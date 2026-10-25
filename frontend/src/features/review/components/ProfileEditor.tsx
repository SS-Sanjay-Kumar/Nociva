import { useState } from 'react'
import type { Genotype, Phenotype } from '../../../types'
import { Fine } from '../../../components/ui/Misc'
import { Button } from '../../../components/ui/Button'
import { DIPLOTYPE_MAX, DIPLOTYPE_PATTERN, PROFILE_COPY, phenotypeOptions } from '../profileEdit'

const FIELD =
  'w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-[13.5px] text-ink focus-visible:outline-2 focus-visible:outline-teal-600'

export function ProfileEditor({
  genotypes,
  genes,
  preset,
  edited,
  onChange,
  onReset,
}: {
  genotypes: Genotype[]
  /** Genes to render, one row each (from the genes endpoint, or the built-in fallback). */
  genes: readonly string[]
  /** The patient's preset genotypes, used for the "Preset: ..." option. */
  preset: Genotype[]
  edited: boolean
  onChange: (gene: string, patch: Partial<Genotype>) => void
  onReset: () => void
}) {
  const [diplotypeError, setDiplotypeError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3 px-3 pb-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-ink-2">{edited ? 'Custom profile (edited)' : 'Preset profile'}</span>
        {edited && (
          <Button size="sm" onClick={onReset}>
            Reset to preset
          </Button>
        )}
      </div>
      {genes.map((gene) => {
        const g = genotypes.find((x) => x.gene === gene) ?? { gene, missing: true }
        const id = `profile-${g.gene}`
        return (
          <fieldset key={g.gene} className="flex flex-col gap-2 rounded-[10px] border border-line p-3">
            <legend className="px-1 font-display text-sm font-bold">{g.gene}</legend>
            <div>
              <label htmlFor={`${id}-phenotype`} className="mb-1 block text-[12.5px] text-ink-2">
                {g.gene} phenotype
              </label>
              <select
                id={`${id}-phenotype`}
                className={FIELD}
                value={g.missing ? '' : (g.phenotype ?? '')}
                onChange={(e) =>
                  onChange(
                    g.gene,
                    e.target.value ? { phenotype: e.target.value as Phenotype, missing: false } : { phenotype: undefined, missing: true },
                  )
                }
              >
                {phenotypeOptions(g.gene, preset.find((x) => x.gene === g.gene)).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
              <div>
                <label htmlFor={`${id}-diplotype`} className="mb-1 block text-[12.5px] text-ink-2">
                  {g.gene} diplotype (optional label)
                </label>
                <input
                  id={`${id}-diplotype`}
                  type="text"
                  className={`${FIELD} font-mono`}
                  maxLength={DIPLOTYPE_MAX}
                  value={g.diplotype ?? ''}
                  aria-invalid={diplotypeError ? true : undefined}
                  aria-describedby={diplotypeError ? 'profile-diplotype-error' : undefined}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!DIPLOTYPE_PATTERN.test(v)) {
                      setDiplotypeError('Diplotype may only contain letters, digits and * / + . -')
                      return
                    }
                    setDiplotypeError(null)
                    onChange(g.gene, { diplotype: v || undefined })
                  }}
                />
              </div>
              {g.gene === 'CYP2D6' && (
                <div>
                  <label htmlFor={`${id}-score`} className="mb-1 block text-[12.5px] text-ink-2">
                    CYP2D6 activity score (optional label)
                  </label>
                  <input
                    id={`${id}-score`}
                    type="number"
                    className={FIELD}
                    min={0}
                    max={4}
                    step={0.25}
                    value={g.activityScore ?? ''}
                    onChange={(e) => {
                      const n = e.target.valueAsNumber
                      onChange(g.gene, { activityScore: Number.isFinite(n) && n >= 0 && n <= 4 ? n : undefined })
                    }}
                  />
                </div>
              )}
            </div>
          </fieldset>
        )
      })}
      {diplotypeError && (
        <p id="profile-diplotype-error" role="alert" className="text-[12.5px] text-crit-700">
          {diplotypeError}
        </p>
      )}
      <Fine>{PROFILE_COPY.driver}</Fine>
      <Fine>{PROFILE_COPY.synthetic}</Fine>
    </div>
  )
}
