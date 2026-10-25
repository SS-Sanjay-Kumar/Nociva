import { Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { Skeleton } from '../../../components/ui/Misc'

const STEPS = ['Resolving genotypes to phenotypes', 'Matching gene–drug–drug rules', 'Collecting evidence references']

export function LoadingPane() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Card>
        <CardHeader>
          <Loader2 size={18} className="animate-spin" />
          <CardTitle className="flex-1">Running assessment</CardTitle>
          <Chip>Deterministic engine</Chip>
        </CardHeader>
        <div className="p-4">
          <ul className="flex flex-col gap-3">
            {STEPS.map((s) => (
              <li key={s} className="flex items-center gap-2.5 text-ink-3">
                <Loader2 size={16} className="animate-spin" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </Card>
      <Skeleton height={190} className="rounded-2xl" />
      <Skeleton height={120} />
      <div className="grid grid-cols-1 gap-4 min-[901px]:grid-cols-2">
        <Skeleton height={150} />
        <Skeleton height={150} />
      </div>
    </div>
  )
}
