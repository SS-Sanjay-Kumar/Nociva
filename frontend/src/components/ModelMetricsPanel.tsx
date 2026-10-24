import type { ModelInfo } from '../types'

export function ModelMetricsPanel({ modelInfo }: { modelInfo: ModelInfo | null }) {
  if (!modelInfo) {
    return <p className="text-sm text-slate-400">Model info unavailable.</p>
  }

  if (!modelInfo.trained || !modelInfo.metrics) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        No trained model artifact found on the backend. Train the model with
        <code className="mx-1 bg-slate-200 rounded px-1">backend/ml/train_cyp2d6_model.py</code>
        to populate evaluation metrics.
      </div>
    )
  }

  const m = modelInfo.metrics

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-800 mb-2">Held-out evaluation metrics</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Metric label="AUPRC" value={m.auprc.toFixed(3)} />
        <Metric label="ROC-AUC" value={m.rocAuc !== null ? m.rocAuc.toFixed(3) : 'n/a'} />
        <Metric label="Precision" value={m.precision.toFixed(3)} />
        <Metric label="Recall" value={m.recall.toFixed(3)} />
        <Metric label="F1" value={m.f1.toFixed(3)} />
        <Metric label="Positive prevalence" value={`${(m.positiveClassPrevalence * 100).toFixed(1)}%`} />
        <Metric label="Train / Val / Test" value={`${m.nTrain} / ${m.nValidation} / ${m.nTest}`} />
        <Metric label="Fingerprint" value={`${modelInfo.fingerprint.type} r=${modelInfo.fingerprint.radius} ${modelInfo.fingerprint.nBits}b`} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Dataset: {modelInfo.dataset.name} ({modelInfo.dataset.license}), via {modelInfo.dataset.source}.
        AUPRC should be compared against positive-class prevalence to judge real lift over a random
        baseline.
      </p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-mono font-semibold text-slate-800">{value}</p>
    </div>
  )
}
