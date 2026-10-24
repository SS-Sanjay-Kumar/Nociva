import { AlertTriangle, Dna } from 'lucide-react'
import type { MolecularAnalysisResponse } from '../types'

export function ClassifierResultCard({ cyp2d6 }: { cyp2d6: MolecularAnalysisResponse['cyp2d6'] }) {
  if (!cyp2d6.modelTrained) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        CYP2D6 classifier has not been trained yet on this backend instance.
      </div>
    )
  }

  const prediction = cyp2d6.prediction
  if (!prediction) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        No prediction returned.
      </div>
    )
  }

  const isInhibitor = prediction.predictedClass === 'inhibitor'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-slate-800">
          <Dna size={16} /> CYP2D6 inhibition classifier
        </h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isInhibitor ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {isInhibitor ? 'Predicted inhibitor' : 'Predicted non-inhibitor'}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Raw model score: <span className="font-mono">{prediction.rawScore.toFixed(4)}</span>{' '}
        {!prediction.scoreCalibrated && (
          <span className="text-xs text-amber-700">(uncalibrated — not a probability)</span>
        )}
      </p>

      {prediction.applicabilityWarning && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 rounded-md px-2 py-1.5">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          {prediction.applicabilityWarning}
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        This predicts an <strong>experimental in-vitro assay label</strong> (CYP2D6_Veith), not clinical
        toxicity, drug-drug-gene outcomes, or patient-specific adverse reactions. It is never fed into the
        deterministic clinical verdict.
      </p>
    </div>
  )
}
