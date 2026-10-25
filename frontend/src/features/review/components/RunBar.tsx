import { Loader2, Play } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Fine } from '../../../components/ui/Misc'

export function RunBar({
  medicationCount,
  loading,
  onRun,
}: {
  medicationCount: number
  loading: boolean
  onRun: () => void
}) {
  const disabled = medicationCount < 2 || loading
  return (
    <div className="sticky bottom-4 flex flex-col gap-2 rounded-[var(--radius-md)] border border-line bg-surface/95 p-3 shadow-[var(--shadow-sh2)] backdrop-blur-sm">
      <Button variant="primary" size="block" disabled={disabled} onClick={onRun}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
        {loading ? 'Running…' : 'Run assessment'}
      </Button>
      <Fine className="text-center">
        {medicationCount < 2 ? 'Add at least two medications to run.' : 'Deterministic rules only. No machine learning is used.'}
      </Fine>
    </div>
  )
}
