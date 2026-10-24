import { Check, Database, FlaskConical, Lock, TriangleAlert } from 'lucide-react'
import { CardHeader, CardSub, CardTitle } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import type { ModelInfo, MolecularAnalysisResponse } from '../../../types'

export function MlPredictionCard({ result, modelInfo }: { result: MolecularAnalysisResponse; modelInfo: ModelInfo | null }) {
  const { cyp2d6 } = result

  if (!cyp2d6.modelTrained) {
    return (
      <section aria-labelledby="ml-title" className="overflow-hidden rounded-[var(--radius-md)] border-[1.5px] border-dashed border-exp-300 bg-surface">
        <HatchedHeader />
        <div className="p-4 text-sm text-ink-2">
          <b id="ml-title">Model not trained yet.</b> Train it with{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12.5px]">
            backend/ml/train_cyp2d6_model.py
          </code>{' '}
          to enable this prediction.
        </div>
        <IsolationNotice />
      </section>
    )
  }

  const prediction = cyp2d6.prediction
  if (!prediction) return null

  const isInhibitor = prediction.predictedClass === 'inhibitor'
  const threshold = modelInfo?.metrics?.decisionThreshold ?? 0.5
  const low = Boolean(prediction.applicabilityWarning)

  return (
    <section aria-labelledby="ml-title" className="overflow-hidden rounded-[var(--radius-md)] border-[1.5px] border-dashed border-exp-300 bg-surface">
      <HatchedHeader />
      <div className="grid grid-cols-1 min-[1101px]:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col gap-3.5 p-[18px]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">Predicted assay class</div>
          <h2 id="ml-title" className="font-display text-[22px] font-extrabold leading-[1.2] tracking-[-0.015em]">
            {isInhibitor ? 'Inhibitor-like in the CYP2D6 assay' : 'Non-inhibitor-like in the CYP2D6 assay'}
          </h2>
          <div>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <b className="font-mono text-[34px] font-medium tracking-[-0.03em] text-exp-800">
                {prediction.rawScore.toFixed(2)}
              </b>
              <span className="text-[12.5px] text-ink-3">Raw model score (uncalibrated)</span>
            </div>
            <div className="relative mt-1.5 h-2.5 rounded-full bg-exp-200">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-exp-600"
                style={{ width: `${prediction.rawScore * 100}%` }}
              />
              <span className="absolute -top-[5px] -bottom-[5px] w-0.5 bg-ink" style={{ left: `${threshold * 100}%` }} />
            </div>
            <div className="relative mt-1 h-4 font-mono text-[11px] text-ink-3">
              <span className="absolute">0</span>
              <span className="absolute -translate-x-1/2" style={{ left: `${threshold * 100}%` }}>
                {threshold.toFixed(2)} threshold
              </span>
              <span className="absolute right-0">1</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip variant={low ? 'amber' : 'teal'} icon={low ? <TriangleAlert size={13} /> : <Check size={13} />}>
              {low ? 'Low similarity to training data (heuristic, not a confidence interval)' : 'Similar to training data'}
            </Chip>
            {result.inTrainingSet && (
              <Chip variant="amber" icon={<Database size={13} />}>
                Query is in the training data. The score reflects memorisation, not generalisation.
              </Chip>
            )}
          </div>
          <p className="text-[12.5px] text-ink-3">
            This score describes activity in a laboratory assay, not what happens in a patient. It has not
            been calibrated against real-world outcomes.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-dashed border-exp-300 p-[18px] min-[1101px]:border-l min-[1101px]:border-t-0">
          <h3 className="flex flex-wrap items-center gap-2 font-display text-sm font-bold">
            <FlaskConical size={16} /> Model evaluation
          </h3>
          <ModelEvalGrid modelInfo={modelInfo} />
        </div>
      </div>
      <IsolationNotice />
    </section>
  )
}

function HatchedHeader() {
  return (
    <>
      <div
        className="h-1.5"
        style={{
          background:
            'repeating-linear-gradient(135deg, var(--color-exp-300) 0 6px, var(--color-exp-50) 6px 12px)',
        }}
      />
      <CardHeader className="border-b border-dashed border-exp-300 bg-exp-50">
        <span className="inline-grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-exp-600 font-display text-xs font-bold text-white">
          B
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-exp-800">Experimental CYP2D6 ML prediction</CardTitle>
          <CardSub>Supervised classifier trained locally on public assay data</CardSub>
        </div>
        <Chip variant="exp" icon={<FlaskConical size={13} />}>
          Experimental
        </Chip>
      </CardHeader>
    </>
  )
}

function IsolationNotice() {
  return (
    <div className="flex items-center gap-2.5 border-t border-dashed border-exp-300 bg-exp-50 px-[18px] py-3 text-[13px] text-exp-800">
      <Lock size={16} />
      <span>
        <b>Isolated from the clinical assessment.</b> This prediction is never an input to the deterministic
        rules engine and cannot change a Medication Review verdict.
      </span>
    </div>
  )
}

function ModelEvalGrid({ modelInfo }: { modelInfo: ModelInfo | null }) {
  if (!modelInfo?.trained || !modelInfo.metrics) {
    return <p className="text-[13px] text-ink-3">Metrics unavailable.</p>
  }
  const m = modelInfo.metrics
  const cells: [string, string][] = [
    ['AUPRC', m.auprc.toFixed(3)],
    ['Prevalence baseline', `${(m.positiveClassPrevalence * 100).toFixed(1)}%`],
    ['ROC-AUC', m.rocAuc !== null ? m.rocAuc.toFixed(3) : 'n/a'],
    ['Precision', m.precision.toFixed(3)],
    ['Recall', m.recall.toFixed(3)],
    ['F1', m.f1.toFixed(3)],
  ]
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {cells.map(([label, value]) => (
          <div key={label} className="rounded-[10px] border border-exp-200 bg-exp-50 px-3 py-2.5">
            <small className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">{label}</small>
            <b className="font-mono text-xl font-medium text-exp-800">{value}</b>
          </div>
        ))}
      </div>
      <ConfusionMatrix matrix={m.confusionMatrix} />
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 gap-y-1.5 text-[12.5px]">
        <dt className="text-ink-3">Split method</dt>
        <dd>{modelInfo.splitMethod ?? '—'}</dd>
        <dt className="text-ink-3">Train / val / test</dt>
        <dd>
          {m.nTrain} / {m.nValidation} / {m.nTest}
        </dd>
        <dt className="text-ink-3">Random seed</dt>
        <dd>{modelInfo.randomSeed ?? '—'}</dd>
        <dt className="text-ink-3">Decision threshold</dt>
        <dd>{m.decisionThreshold !== null && m.decisionThreshold !== undefined ? m.decisionThreshold.toFixed(3) : '—'}</dd>
      </dl>
    </>
  )
}

function ConfusionMatrix({ matrix }: { matrix: number[][] }) {
  if (!matrix || matrix.length !== 2) return null
  const [[tn, fp], [fn, tp]] = matrix
  const cells: [string, number][] = [
    ['True neg.', tn],
    ['False pos.', fp],
    ['False neg.', fn],
    ['True pos.', tp],
  ]
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {cells.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-line-2 bg-surface px-2.5 py-1.5 text-center">
          <div className="font-mono text-sm font-semibold">{value}</div>
          <div className="text-[10.5px] text-ink-3">{label}</div>
        </div>
      ))}
    </div>
  )
}
