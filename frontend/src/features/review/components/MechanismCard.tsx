import { ArrowRight, Activity, CircleHelp, Minus, Search } from 'lucide-react'
import type { CheckItem, FlowNode, FlowNodeKind } from '../../../types'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { Fine } from '../../../components/ui/Misc'

const NODE_STYLE: Record<FlowNodeKind, string> = {
  gene: 'bg-teal-50 border-teal-100',
  inhibitor: 'bg-slate-100 border-slate-200',
  substrate: 'bg-surface border-line',
  effect: 'bg-amber-50 border-amber-200',
  unknown: 'bg-surface border-dashed border-[#9FB0C6]',
  missing:
    'border-dashed border-[#9FB0C6] bg-[repeating-linear-gradient(135deg,var(--color-surface)_0,var(--color-surface)_6px,var(--color-surface-2)_6px,var(--color-surface-2)_12px)]',
}

export function MechanismCard({ mechanism, checks }: { mechanism?: FlowNode[]; checks?: CheckItem[] }) {
  const hasMechanism = mechanism && mechanism.length > 0
  const title = hasMechanism ? 'Mechanism' : 'What was checked'

  return (
    <Card>
      <CardHeader>
        {hasMechanism ? <Activity size={18} /> : <Search size={18} />}
        <CardTitle className="flex-1">{title}</CardTitle>
        {hasMechanism && <Fine className="text-ink-3">How the genotype and medications connect</Fine>}
      </CardHeader>
      <div className="p-4">
        {hasMechanism ? (
          <div className="flex items-stretch gap-0 max-[1100px]:flex-col max-[1100px]:gap-2.5">
            {mechanism!.map((node, i) => (
              <div key={i} className="flex items-center max-[1100px]:flex-col">
                {i > 0 && (
                  <div className="grid w-[26px] flex-none place-items-center text-ink-3 max-[1100px]:h-[26px] max-[1100px]:w-auto max-[1100px]:rotate-90">
                    <ArrowRight size={18} />
                  </div>
                )}
                <div className={`flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl border p-3 ${NODE_STYLE[node.kind]}`}>
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-3">{node.label}</div>
                  <div className="font-semibold leading-tight">{node.title}</div>
                  <div className="text-[12.5px] text-ink-3">{node.sub}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="flex flex-col">
            {(checks ?? []).map((c, i) => (
              <li key={i} className="flex items-center gap-3 border-t border-line-2 py-3 first:border-t-0">
                {c.missing ? <CircleHelp size={18} className="text-ink-3" /> : <Minus size={18} className="text-ink-3" />}
                <div className="min-w-0 flex-1">
                  <strong className="block font-semibold">{c.label}</strong>
                  <span className="block text-[12.5px] text-ink-3">{c.note}</span>
                </div>
                <Chip variant={c.missing ? 'miss' : 'default'}>{c.missing ? 'Gene result missing' : 'No curated entry'}</Chip>
              </li>
            ))}
            {(!checks || checks.length === 0) && <Fine>No medication pairs to check.</Fine>}
          </ul>
        )}
      </div>
    </Card>
  )
}
