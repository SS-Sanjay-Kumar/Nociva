import { AlertCircle, Check, Loader2, Search } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { Button } from '../../../components/ui/Button'
import { Eyebrow } from '../../../components/ui/Misc'

const EXAMPLES = [
  { label: 'Fluoxetine', smiles: 'CNCCC(c1ccccc1)Oc1ccc(cc1)C(F)(F)F' },
  { label: 'Aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O' },
  { label: 'Metformin', smiles: 'CN(C)C(=N)NC(=N)N' },
  { label: 'Invalid example', smiles: 'CNCCC(c1ccccc1' },
]

export function SmilesInputCard({
  value,
  onChange,
  onAnalyze,
  onPickExample,
  onClear,
  loading,
  fieldError,
  valid,
}: {
  value: string
  onChange: (value: string) => void
  onAnalyze: () => void
  onPickExample: (smiles: string) => void
  onClear: () => void
  loading: boolean
  fieldError?: string | null
  valid: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex-1">Input molecule</CardTitle>
        {valid && (
          <Chip variant="teal" icon={<Check size={13} />}>
            Valid SMILES
          </Chip>
        )}
      </CardHeader>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <label htmlFor="smiles-input" className="mb-1.5 block">
            <Eyebrow>SMILES</Eyebrow>
          </label>
          <textarea
            id="smiles-input"
            value={value}
            spellCheck={false}
            placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                onAnalyze()
              }
            }}
            className={`block min-h-[92px] w-full resize-y overflow-x-auto rounded-[10px] border bg-surface-2 p-3 font-mono text-[13px] leading-[1.55] text-ink outline-none focus:bg-surface focus:shadow-[0_0_0_3px_rgba(91,77,187,0.16)] focus:border-exp-600 ${
              fieldError ? 'border-crit-700 bg-crit-50' : 'border-line'
            }`}
          />
        </div>

        {fieldError && (
          <div role="alert" className="flex items-center gap-2 text-sm text-crit-700">
            <AlertCircle size={16} />
            <span>{fieldError}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="exp" className="flex-1" onClick={onAnalyze} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? 'Analyzing…' : 'Validate and search'}
          </Button>
          <Button onClick={onClear}>Clear</Button>
        </div>

        <div>
          <Eyebrow className="mb-1.5">Examples</Eyebrow>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => onPickExample(ex.smiles)}
                className="rounded-full border border-line bg-surface px-2.5 py-1 text-[12.5px] font-medium hover:border-exp-300 hover:bg-exp-50"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
