import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Medication } from '../types'

interface Props {
  medications: Medication[]
  selectedIds: string[]
  onToggle: (medicationId: string) => void
}

export function MedicationSearch({ medications, selectedIds, onToggle }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return medications
    return medications.filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase()))
  }, [medications, query])

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-600 mb-2">2. Search and select medications</h2>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search medication name…"
          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {filtered.map((med) => {
          const selected = selectedIds.includes(med.id)
          return (
            <button
              key={med.id}
              type="button"
              onClick={() => onToggle(med.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                selected
                  ? 'border-indigo-500 bg-indigo-500 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
              }`}
            >
              {med.name}
              {med.drugClass && <span className="ml-1.5 text-xs opacity-70">· {med.drugClass}</span>}
            </button>
          )
        })}
        {filtered.length === 0 && <p className="text-sm text-slate-400">No medications match "{query}".</p>}
      </div>
    </div>
  )
}
