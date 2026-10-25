import type { PatientProfile } from '../../../types'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { StepBadge } from '../../../components/ui/Misc'

export function PatientCard({
  patients,
  selectedId,
  onPick,
}: {
  patients: PatientProfile[]
  selectedId: string | null
  onPick: (patient: PatientProfile) => void
}) {
  return (
    <Card>
      <CardHeader>
        <StepBadge>1</StepBadge>
        <CardTitle>Synthetic patient</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-2 p-3" role="radiogroup" aria-label="Synthetic patient">
        {patients.map((p) => {
          const checked = p.id === selectedId
          const initial = p.label.replace('Synthetic Patient ', '')
          return (
            <button
              key={p.id}
              role="radio"
              aria-checked={checked}
              type="button"
              onClick={() => onPick(p)}
              className={`flex w-full items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition ${
                checked
                  ? 'border-teal-600 bg-teal-50 shadow-[inset_0_0_0_1px_var(--color-teal-600)]'
                  : 'border-line bg-surface hover:border-[#B9C7D8]'
              }`}
            >
              <span
                className={`grid h-[34px] w-[34px] flex-none place-items-center rounded-full font-display font-extrabold ${
                  checked ? 'bg-teal-600 text-white' : 'bg-slate-100 text-navy-700'
                }`}
              >
                {initial}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-2 font-semibold">
                  {p.label}
                  <small className="font-mono text-[11.5px] font-normal text-ink-3">{p.id}</small>
                </span>
                <span className="block text-[12.5px] text-ink-3">
                  {p.age} {p.sex === 'male' ? 'M' : p.sex === 'female' ? 'F' : 'O'}
                  {p.context ? ` · ${p.context}` : ''}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
