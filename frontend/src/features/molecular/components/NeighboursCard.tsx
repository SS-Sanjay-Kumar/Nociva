import { Info, Search } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardSub } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { Banner } from '../../../components/ui/Banner'
import type { MolecularAnalysisResponse } from '../../../types'

export function NeighboursCard({ result }: { result: MolecularAnalysisResponse }) {
  const { neighbors, provenance, maxSimilarity } = result
  const fp = provenance.fingerprint

  const methodLine = fp
    ? `Morgan fingerprint, radius ${fp.radius}, ${fp.nBits} bits · Tanimoto similarity · reporting threshold ${provenance.reportingThreshold?.toFixed(2)} · reference set: ${provenance.dataset}${
        provenance.referenceSetSize ? `, ${provenance.referenceSetSize} compounds` : ''
      }`
    : provenance.method

  return (
    <Card>
      <CardHeader>
        <span className="inline-grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-navy-900 font-display text-xs font-bold text-white">
          A
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle>Molecular neighbours</CardTitle>
          <CardSub>Reference compounds with the most similar structure</CardSub>
        </div>
        <Chip variant="navy">Descriptive, not predictive</Chip>
      </CardHeader>

      <p className="px-4 pt-2.5 text-[12.5px] text-ink-3">
        <b className="font-medium text-ink-2">Method</b> · {methodLine}
      </p>

      {neighbors.length > 0 ? (
        <ul className="flex flex-col px-4 py-1">
          {neighbors.map((n, i) => (
            <li
              key={n.identifier}
              className="grid grid-cols-[22px_84px_minmax(0,1fr)_minmax(120px,170px)] items-center gap-3.5 border-t border-line-2 py-3 first:border-t-0 max-[720px]:grid-cols-[70px_minmax(0,1fr)] max-[720px]:gap-2.5"
            >
              <span className="font-mono text-xs text-ink-3 max-[720px]:hidden">{i + 1}</span>
              <div className="h-[62px] w-[62px] overflow-hidden rounded-lg border border-line-2 bg-surface p-0.5">
                {n.imageBase64 && (
                  <img
                    src={`data:image/png;base64,${n.imageBase64}`}
                    alt={n.identifier}
                    className="h-full w-full object-contain"
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-mono text-[11px] text-ink-3" title={n.canonicalSmiles}>
                  {n.identifier} · {n.canonicalSmiles}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 max-[720px]:col-span-2">
                <div className="text-right font-mono text-lg font-medium tracking-[-0.02em]">
                  {n.tanimotoSimilarity.toFixed(2)}
                </div>
                <div
                  role="img"
                  aria-label={`Tanimoto ${n.tanimotoSimilarity.toFixed(2)}`}
                  className="h-2 overflow-hidden rounded-full bg-slate-200"
                >
                  <span
                    className="block h-full rounded-full bg-navy-700"
                    style={{ width: `${n.tanimotoSimilarity * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex gap-3 px-4 py-5 text-ink-2">
          <Search size={20} className="mt-0.5 flex-none" />
          <div>
            <b>No close neighbours found</b>
            <p className="mt-0.5 text-[12.5px] text-ink-3">
              {maxSimilarity !== null && maxSimilarity !== undefined
                ? `No reference compound reached the ${provenance.reportingThreshold?.toFixed(2)} threshold. The highest score was ${maxSimilarity.toFixed(2)}. This structure is unlike the reference set.`
                : 'The similarity reference index is not available on this backend instance.'}
            </p>
          </div>
        </div>
      )}

      <div className="p-4 pt-0">
        <Banner variant="slate">
          <Info size={16} />
          <span>
            <b>Similarity is not interaction risk.</b> Structurally similar molecules can behave differently in
            the body, and dissimilar ones can interact. A high score does not establish a clinical interaction.
          </span>
        </Banner>
      </div>
    </Card>
  )
}
