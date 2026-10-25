import { Link2 } from 'lucide-react'
import type { Association } from '../../../types'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { titleCase } from '../liveApi'

/** Lists the engine's matched gene–drug and gene–drug–drug associations (rule id, gene, medication, inhibitor). */
export function AssociationsCard({ associations }: { associations: Association[] }) {
  return (
    <Card>
      <CardHeader>
        <Link2 size={18} />
        <CardTitle className="flex-1">Matched associations</CardTitle>
        <Chip variant="teal">{associations.length}</Chip>
      </CardHeader>
      <ul className="m-0 list-none p-4">
        {associations.map((a) => (
          <li key={a.ruleId} className="border-t border-line-2 py-3 first:border-t-0 first:pt-0 last:pb-0">
            <div className="font-mono text-[12.5px] text-ink-3">{a.ruleId}</div>
            <div className="mt-0.5 font-semibold leading-snug">
              {a.gene} × {titleCase(a.medication)}
              {a.inhibitor ? ` · inhibitor: ${titleCase(a.inhibitor)}` : ''}
            </div>
            {a.inhibitor && (
              <div className="mt-0.5 text-[12.5px] text-ink-3">Demo inhibitor list, not a clinical source.</div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}
