import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { Medication } from '../../../types'

export function MedicationCombobox({
  medications,
  selectedIds,
  onAdd,
}: {
  medications: Medication[]
  selectedIds: string[]
  onAdd: (medicationId: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return medications
      .filter((m) => !selectedIds.includes(m.id))
      .filter((m) => !q || m.name.toLowerCase().includes(q) || (m.drugClass ?? '').toLowerCase().includes(q))
      .slice(0, 7)
  }, [medications, selectedIds, query])

  const pick = (m: Medication) => {
    onAdd(m.id)
    setQuery('')
    setHighlighted(0)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlighted((h) => Math.min(h + 1, Math.max(items.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && items[highlighted]) {
        e.preventDefault()
        pick(items[highlighted])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative px-3 pt-3">
      <label htmlFor="med-search" className="sr-only">
        Search medications
      </label>
      <div className="flex h-[42px] items-center gap-2 rounded-[10px] border border-line bg-surface px-3 text-ink-3 focus-within:border-teal-600 focus-within:shadow-[0_0_0_3px_rgba(19,161,163,0.18)]">
        <Search size={16} />
        <input
          id="med-search"
          role="combobox"
          aria-expanded={open}
          aria-controls="med-list"
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Search medications, e.g. tamoxifen"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setHighlighted(0)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 border-0 bg-transparent text-ink outline-none"
        />
      </div>
      {open && (
        <ul
          id="med-list"
          role="listbox"
          className="absolute left-3 right-3 top-[calc(100%+4px)] z-10 max-h-[300px] overflow-auto rounded-xl border border-line bg-surface p-1.5 shadow-[var(--shadow-sh2)]"
        >
          {items.length ? (
            items.map((m, i) => (
              <li
                key={m.id}
                role="option"
                aria-selected={i === highlighted}
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(m)
                }}
                onMouseEnter={() => setHighlighted(i)}
                className={`flex cursor-pointer items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 ${
                  i === highlighted ? 'bg-teal-50' : ''
                }`}
              >
                <div>
                  <strong className="block font-semibold">{m.name}</strong>
                  <span className="block text-xs text-ink-3">{m.drugClass}</span>
                </div>
                {m.drugClass && (
                  <em className="rounded-full bg-slate-100 px-2 py-0.5 text-right text-[11.5px] not-italic text-ink-2">
                    {m.drugClass}
                  </em>
                )}
              </li>
            ))
          ) : (
            <li className="cursor-default px-2.5 py-2 text-ink-3">No matching medication in the supported list</li>
          )}
        </ul>
      )}
    </div>
  )
}
