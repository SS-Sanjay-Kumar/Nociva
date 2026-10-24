import type { SimilarityNeighbor } from '../types'

export function SimilarityNeighborsList({ neighbors }: { neighbors: SimilarityNeighbor[] }) {
  if (neighbors.length === 0) {
    return <p className="text-sm text-slate-400">No reference neighbours returned.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {neighbors.map((n) => (
        <div key={n.identifier} className="rounded-lg border border-slate-200 bg-white p-3 text-center">
          {n.imageBase64 ? (
            <img
              src={`data:image/png;base64,${n.imageBase64}`}
              alt={n.identifier}
              className="mx-auto mb-2 h-24 w-24 object-contain"
            />
          ) : (
            <div className="mx-auto mb-2 h-24 w-24 flex items-center justify-center text-xs text-slate-400 border border-dashed rounded">
              no image
            </div>
          )}
          <p className="text-xs font-medium text-slate-700 truncate" title={n.identifier}>
            {n.identifier}
          </p>
          <p className="text-xs text-slate-500 truncate font-mono" title={n.canonicalSmiles}>
            {n.canonicalSmiles}
          </p>
          <p className="mt-1 text-sm font-semibold text-indigo-600">
            {(n.tanimotoSimilarity * 100).toFixed(1)}% Tanimoto
          </p>
        </div>
      ))}
    </div>
  )
}
