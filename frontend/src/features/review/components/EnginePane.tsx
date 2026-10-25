import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Chip } from '../../../components/ui/Chip'
import { COPY } from '../copy'

/**
 * Rendered only when the assessment request failed. Never renders a
 * verdict — an unreachable engine is a distinct state from any of the
 * three documented outcomes.
 */
export function EnginePane({ onRetry, message }: { onRetry: () => void; message?: string }) {
  return (
    <div role="alert" className="flex gap-4 rounded-[var(--radius-lg)] border border-crit-200 bg-crit-50 p-5">
      <AlertCircle size={28} className="flex-none text-crit-700" />
      <div className="flex-1">
        <h2 className="font-display text-[22px] font-extrabold tracking-[-0.01em] text-crit-700">
          {COPY.error.title}
        </h2>
        <p className="mt-1.5 max-w-[60ch] text-ink-2">
          {message ? `${message}. ${COPY.error.live}` : COPY.error.body}
        </p>
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" onClick={onRetry}>
            <RotateCcw size={14} />
            Try again
          </Button>
          {!message && <Chip variant="crit">Error code: ENGINE_TIMEOUT</Chip>}
        </div>
      </div>
    </div>
  )
}
