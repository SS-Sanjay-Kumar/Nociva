import { BookOpen, FlaskConical, Info } from 'lucide-react'
import type { AssessmentResult } from '../types'
import { EvidenceStatusBadge } from './EvidenceStatusBadge'

export function AssessmentResultCard({ result }: { result: AssessmentResult }) {
  const { medication, verdict, isMock } = result

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">{medication.name}</h3>
          {medication.drugClass && <p className="text-xs text-slate-500">{medication.drugClass}</p>}
        </div>
        <EvidenceStatusBadge status={verdict.evidenceStatus} />
      </div>

      <p className="mt-3 text-sm text-slate-700">{verdict.summary}</p>

      {verdict.recommendation && (
        <p className="mt-2 text-sm text-slate-800 bg-slate-50 rounded-md px-3 py-2">
          <span className="font-medium">Recommendation: </span>
          {verdict.recommendation}
        </p>
      )}

      {verdict.references.length > 0 && (
        <div className="mt-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <BookOpen size={13} /> Evidence references
          </p>
          <ul className="mt-1 space-y-1">
            {verdict.references.map((ref, i) => (
              <li key={i} className="text-xs text-slate-600">
                <span className="font-medium">{ref.source}:</span> {ref.citation}
                {ref.url && (
                  <>
                    {' '}
                    <a href={ref.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                      link
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {verdict.limitations.length > 0 && (
        <div className="mt-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <Info size={13} /> Limitations
          </p>
          <ul className="mt-1 list-disc list-inside space-y-0.5">
            {verdict.limitations.map((lim, i) => (
              <li key={i} className="text-xs text-slate-500">
                {lim}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isMock && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 rounded-md px-2 py-1 w-fit">
          <FlaskConical size={12} />
          Demonstration fixture — not a live clinical result
        </div>
      )}
    </div>
  )
}
