import type { SimulateResponse } from '../../../contracts/pk'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { Fine } from '../../../components/ui/Misc'

export function InterpretationPanel({ result }: { result: SimulateResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex-1">Interpretation</CardTitle>
        {result.provenance.synthetic && <Chip variant="exp">Synthetic</Chip>}
        <Chip variant="amber">{result.validationStatus}</Chip>
      </CardHeader>
      <div className="flex flex-col gap-4 p-4">
        <p className="max-w-[70ch] text-[15px] text-ink">{result.interpretation}</p>

        {result.monteCarlo && (
          <Fine>
            Monte Carlo: {result.monteCarlo.label} ({result.monteCarlo.samples} samples, CL CV {result.monteCarlo.clearanceCv}, V CV{' '}
            {result.monteCarlo.volumeCv}, seed {result.monteCarlo.seed}).
          </Fine>
        )}

        {result.contextual && (
          <Fine>
            Contextual information provided: {Object.entries(result.contextual)
              .filter(([k, v]) => k !== 'note' && v !== undefined)
              .map(([k, v]) => `${k} ${v}`)
              .join(', ') || 'none'}. {result.contextual.note}.
          </Fine>
        )}

        <div className="grid grid-cols-1 gap-4 min-[901px]:grid-cols-2">
          <section aria-labelledby="pk-assumptions">
            <h3 id="pk-assumptions" className="mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">Assumptions</h3>
            <ul className="list-disc pl-5 text-[13.5px] text-ink-2">
              {result.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="pk-limitations">
            <h3 id="pk-limitations" className="mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">Limitations</h3>
            <ul className="list-disc pl-5 text-[13.5px] text-ink-2">
              {result.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
        </div>

        <Fine>
          {result.modelVersion} · Provenance: {result.provenance.source}
          {result.provenance.synthetic ? ' (built-in synthetic compound)' : ' (user-modified values)'}
        </Fine>
      </div>
    </Card>
  )
}
