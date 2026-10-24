import type { EvidenceStatus } from '../types'

const STYLES: Record<EvidenceStatus, { label: string; className: string }> = {
  association_found: {
    label: 'Association found',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  no_documented_association: {
    label: 'No documented association',
    className: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  insufficient_evidence: {
    label: 'Insufficient evidence',
    className: 'bg-amber-100 text-amber-800 border-amber-300',
  },
}

export function EvidenceStatusBadge({ status }: { status: EvidenceStatus }) {
  const style = STYLES[status]
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${style.className}`}>
      {style.label}
    </span>
  )
}
