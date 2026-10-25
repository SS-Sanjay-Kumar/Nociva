import { RotateCcw, ServerCrash } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

/** Shown when a PK request fails. Renders no curves. */
export function ServiceDownPane({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex gap-4 rounded-[var(--radius-lg)] border border-crit-200 bg-crit-50 p-5">
      <ServerCrash size={28} className="flex-none text-crit-700" />
      <div className="flex-1">
        <h2 className="font-display text-[22px] font-extrabold tracking-[-0.01em] text-crit-700">{message}</h2>
        <p className="mt-1.5 max-w-[60ch] text-ink-2">
          No simulation was produced. Start the backend from the repo root with{' '}
          <code className="font-mono text-[12.5px]">uvicorn app.main:app --port 8000</code>, then try again.
        </p>
        <div className="mt-3.5">
          <Button variant="primary" size="sm" onClick={onRetry}>
            <RotateCcw size={14} />
            Retry
          </Button>
        </div>
      </div>
    </div>
  )
}
