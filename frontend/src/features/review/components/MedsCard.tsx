import { Pill, X } from 'lucide-react'
import type { Medication } from '../../../types'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { Fine } from '../../../components/ui/Misc'
import { StepBadge } from '../../../components/ui/Misc'
import { MedicationCombobox } from './MedicationCombobox'

export function MedsCard({
  medications,
  selectedIds,
  onAdd,
  onRemove,
}: {
  medications: Medication[]
  selectedIds: string[]
  onAdd: (medicationId: string) => void
  onRemove: (medicationId: string) => void
}) {
  const selected = selectedIds
    .map((id) => medications.find((m) => m.id === id))
    .filter((m): m is Medication => Boolean(m))

  return (
    <Card>
      <CardHeader>
        <StepBadge>3</StepBadge>
        <CardTitle className="flex-1">Medications</CardTitle>
        <Chip>{selected.length} selected</Chip>
      </CardHeader>

      <MedicationCombobox medications={medications} selectedIds={selectedIds} onAdd={onAdd} />

      <div className="flex flex-col gap-2 p-3">
        {selected.length === 0 && <Fine className="px-0.5 py-1.5">No medications yet. Search above to add at least two.</Fine>}
        {selected.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3 py-2.5 pl-3">
            <Pill size={18} className="text-teal-700" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{m.name}</div>
              <div className="text-xs text-ink-3">{m.drugClass}</div>
            </div>
            <button
              type="button"
              aria-label={`Remove ${m.name}`}
              onClick={() => onRemove(m.id)}
              className="grid h-7 w-7 place-items-center rounded-lg text-ink-3 hover:bg-slate-100 hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}
