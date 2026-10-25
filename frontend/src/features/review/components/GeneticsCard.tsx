import { Dna, Zap } from 'lucide-react'
import type { Genotype, PatientProfile } from '../../../types'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Chip, type ChipVariant } from '../../../components/ui/Chip'
import { Fine, StepBadge } from '../../../components/ui/Misc'

function phenotypeLabel(g: Genotype) {
  return g.phenotype ? g.phenotype.replaceAll('_', ' ') : ''
}

function phenotypeChipVariant(phenotype?: Genotype['phenotype']): ChipVariant {
  switch (phenotype) {
    case 'normal_metabolizer':
      return 'teal'
    case 'poor_metabolizer':
    case 'intermediate_metabolizer':
      return 'amber'
    case 'rapid_metabolizer':
    case 'ultrarapid_metabolizer':
      return 'navy'
    default:
      return 'default'
  }
}

export function GeneticsCard({
  patient,
  flagText,
  children,
}: {
  patient: PatientProfile
  flagText?: string | null
  children?: React.ReactNode
}) {
  const d6 = patient.genotypes.find((g) => g.gene === 'CYP2D6')
  const rest = patient.genotypes.filter((g) => g.gene !== 'CYP2D6')
  if (!d6) return null

  const score = d6.activityScore ?? 0
  const pct = Math.min(100, Math.max(0, (score / 3) * 100))

  return (
    <Card>
      <CardHeader>
        <StepBadge>2</StepBadge>
        <CardTitle className="flex-1">Pharmacogenetic profile</CardTitle>
        <Chip icon={<Dna size={13} />}>Synthetic</Chip>
      </CardHeader>

      <div className="m-3 flex flex-col gap-3 rounded-[10px] border border-line bg-surface-2 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-display text-lg font-extrabold tracking-[-0.01em]">CYP2D6</span>
          {d6.missing ? <Chip variant="miss">Not tested</Chip> : <Chip variant={phenotypeChipVariant(d6.phenotype)}>{phenotypeLabel(d6)}</Chip>}
        </div>
        {!d6.missing && (
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-[22px] font-medium tracking-[-0.02em]">{d6.diplotype}</span>
            {d6.activityScore !== undefined && <Fine>Activity score {score.toFixed(1)}</Fine>}
          </div>
        )}
        {d6.activityScore !== undefined && (
        <div className="flex flex-col gap-1.5">
          <div className="relative">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
              <span className="h-full bg-amber-100" style={{ width: '41.67%' }} />
              <span className="h-full bg-teal-100" style={{ width: '33.33%' }} />
              <span className="h-full bg-slate-200" style={{ width: '25%' }} />
            </div>
            <span
              role="img"
              aria-label={`Activity score ${score.toFixed(1)} on a 0 to 3 scale`}
              className="absolute -top-1 h-[18px] w-1 -translate-x-1/2 rounded-sm bg-navy-900 shadow-[0_0_0_2px_var(--color-surface-2)]"
              style={{ left: `${pct}%` }}
            />
          </div>
          <div className="flex text-[10.5px] font-semibold tracking-[0.05em] text-ink-3">
            <span style={{ width: '41.67%' }} className="text-center">
              IM
            </span>
            <span style={{ width: '33.33%' }} className="text-center">
              NM
            </span>
            <span style={{ width: '25%' }} className="text-center">
              UM
            </span>
          </div>
        </div>
        )}
      </div>

      {flagText && (
        <div className="m-3 flex gap-2.5 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-800" role="note">
          <Zap size={16} className="mt-0.5 flex-none" />
          <span>{flagText}</span>
        </div>
      )}

      <div className="flex flex-col px-3 pb-1 pt-2">
        {rest.map((g) => (
          <div key={g.gene} className="grid grid-cols-[72px_64px_minmax(0,1fr)] items-center gap-2 border-t border-line-2 py-2.5 first:border-t-0">
            <b className="font-display font-bold">{g.gene}</b>
            {g.missing ? (
              <>
                <span className="text-[13px] text-ink-3">—</span>
                <span>
                  <Chip variant="miss">Not tested</Chip>
                </span>
              </>
            ) : (
              <>
                <span className="font-mono text-[13px]">{g.diplotype}</span>
                <span>
                  <Chip variant={phenotypeChipVariant(g.phenotype)}>{phenotypeLabel(g)}</Chip>
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      {children}

      <Fine className="px-4 pb-3.5 pt-2.5">
        Activity score bands follow CPIC and DPWG consensus. Supported genes in this demo: CYP2D6, CYP2C19,
        CYP2C9, CYP3A5.
      </Fine>
    </Card>
  )
}
