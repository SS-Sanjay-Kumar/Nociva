import { ServerCrash } from 'lucide-react'

export function ServiceUnavailablePane({ message }: { message: string }) {
  return (
    <div role="alert" className="flex gap-4 rounded-[var(--radius-lg)] border border-crit-200 bg-crit-50 p-5">
      <ServerCrash size={28} className="flex-none text-crit-700" />
      <div className="flex-1">
        <h2 className="font-display text-[22px] font-extrabold tracking-[-0.01em] text-crit-700">
          Molecular service unavailable
        </h2>
        <p className="mt-1.5 max-w-[60ch] text-ink-2">{message}</p>
        <p className="mt-3 text-[13px] text-ink-3">Start it with, from the repo root:</p>
        <pre className="mt-1.5 overflow-x-auto rounded-lg border border-line-2 bg-surface-2 p-3 font-mono text-[12.5px] text-ink-2">
          {'source .venv/bin/activate && uvicorn app.main:app --reload --port 8000'}
        </pre>
      </div>
    </div>
  )
}
