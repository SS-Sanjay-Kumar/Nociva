import { ShieldAlert } from 'lucide-react'

/**
 * Shown when a backend response fails its zod contract — never crash or
 * render a half-validated verdict/prediction, say exactly what didn't match.
 */
export function ContractErrorPane({ path, message }: { path: string; message: string }) {
  return (
    <div role="alert" className="flex gap-4 rounded-[var(--radius-lg)] border border-crit-200 bg-crit-50 p-5">
      <ShieldAlert size={28} className="flex-none text-crit-700" />
      <div className="flex-1">
        <h2 className="font-display text-[22px] font-extrabold tracking-[-0.01em] text-crit-700">
          Unexpected response from service
        </h2>
        <p className="mt-1.5 max-w-[60ch] text-ink-2">{message}</p>
        <p className="mt-2 font-mono text-[12.5px] text-crit-700">field: {path}</p>
      </div>
    </div>
  )
}
