import { CircleHelp, Lock, Search, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { Banner } from '../../../components/ui/Banner'
import { COPY } from '../copy'

const OUTCOMES = [
  {
    icon: TriangleAlert,
    title: COPY.verdict.found.title,
    body: 'A curated, evidence-supported gene–drug–drug association applies to this patient and medication list.',
    tone: 'border-amber-200 bg-amber-50',
    iconTone: 'bg-amber-100 text-amber-800',
  },
  {
    icon: Search,
    title: COPY.verdict.none.title,
    body: 'Nothing in the supported rule set matches. This is not a statement that the combination is safe.',
    tone: 'border-line bg-surface',
    iconTone: 'bg-slate-200 text-navy-700',
  },
  {
    icon: CircleHelp,
    title: COPY.verdict.insufficient.title,
    body: 'Evidence conflicts, or a required result such as a genotype is missing.',
    tone: 'border-line bg-surface border-dashed',
    iconTone: 'bg-slate-200 text-navy-700',
  },
]

export function IdlePane() {
  return (
    <Card>
      <CardHeader>
        <ShieldCheck size={18} />
        <CardTitle className="flex-1">Assessment</CardTitle>
        <Chip>Not run yet</Chip>
      </CardHeader>
      <div className="flex flex-col gap-4 p-4">
        <p className="max-w-[62ch] text-ink-2">
          Choose a synthetic patient and at least two medications, then run the assessment. The deterministic
          engine returns exactly one of three outcomes.
        </p>
        <div className="grid grid-cols-1 gap-3 min-[901px]:grid-cols-3">
          {OUTCOMES.map((o) => (
            <div key={o.title} className={`flex flex-col gap-2.5 rounded-xl border p-4 ${o.tone}`}>
              <div className={`grid h-[38px] w-[38px] place-items-center rounded-[10px] ${o.iconTone}`}>
                <o.icon size={20} />
              </div>
              <h3 className="font-display text-[15px] font-bold leading-tight">{o.title}</h3>
              <p className="text-[13px] text-ink-2">{o.body}</p>
            </div>
          ))}
        </div>
        <Banner variant="slate">
          <Lock size={16} />
          <span>{COPY.idle.footer}</span>
        </Banner>
      </div>
    </Card>
  )
}
