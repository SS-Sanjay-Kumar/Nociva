import { User } from 'lucide-react'
import type { PatientProfile } from '../types'

interface Props {
  patients: PatientProfile[]
  selectedId: string | null
  onSelect: (patient: PatientProfile) => void
}

export function PatientSelector({ patients, selectedId, onSelect }: Props) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-600 mb-2">1. Select a synthetic patient profile</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {patients.map((patient) => {
          const selected = patient.id === selectedId
          return (
            <button
              key={patient.id}
              type="button"
              onClick={() => onSelect(patient)}
              className={`text-left rounded-xl border p-4 transition ${
                selected
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                  : 'border-slate-200 bg-white hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <User size={16} />
                {patient.label}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {patient.age}y · {patient.sex}
              </p>
              <ul className="mt-2 space-y-1">
                {patient.genotypes.map((g) => (
                  <li key={g.gene} className="text-xs text-slate-600">
                    <span className="font-mono">{g.gene}</span> {g.diplotype} —{' '}
                    <span className="italic">{g.phenotype.replaceAll('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>
    </div>
  )
}
