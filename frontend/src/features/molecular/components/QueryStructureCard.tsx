import { Hexagon } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { Fine } from '../../../components/ui/Misc'
import type { MolecularAnalysisResponse } from '../../../types'

export function QueryStructureCard({ result }: { result: MolecularAnalysisResponse | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex-1">Query structure</CardTitle>
        <Chip>2D depiction</Chip>
      </CardHeader>
      <div className="flex flex-col gap-3.5 p-4">
        <div className="grid h-[210px] place-items-center rounded-[10px] border border-line-2 bg-surface p-1.5">
          {result?.queryImageBase64 ? (
            <img
              src={`data:image/png;base64,${result.queryImageBase64}`}
              alt={`${result.canonicalSmiles ?? 'Query'} structure`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 p-3 text-center text-[12.5px] text-ink-3">
              <Hexagon size={34} />
              {result ? 'No structure to draw' : 'Enter a SMILES string'}
            </div>
          )}
        </div>
        {result && result.canonicalSmiles && (
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 gap-y-2 text-[13px]">
            <dt className="text-ink-3">Formula</dt>
            <dd className="font-medium">{result.molecularFormula ?? '—'}</dd>
            <dt className="text-ink-3">Mol. weight</dt>
            <dd className="font-medium">{result.molecularWeight ? `${result.molecularWeight} g/mol` : '—'}</dd>
            <dt className="text-ink-3">SMILES</dt>
            <dd className="break-all font-mono text-[12px] font-normal">{result.canonicalSmiles}</dd>
          </dl>
        )}
        <Fine>Rendered locally with RDKit on the backend.</Fine>
      </div>
    </Card>
  )
}
