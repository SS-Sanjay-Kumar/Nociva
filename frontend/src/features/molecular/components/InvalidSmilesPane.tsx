import { AlertCircle } from 'lucide-react'

export function InvalidSmilesPane({ message }: { message: string }) {
  return (
    <div role="alert" className="flex gap-4 rounded-[var(--radius-lg)] border border-crit-200 bg-crit-50 p-5">
      <AlertCircle size={28} className="flex-none text-crit-700" />
      <div className="flex-1">
        <h2 className="font-display text-[22px] font-extrabold tracking-[-0.01em] text-crit-700">
          This SMILES could not be parsed
        </h2>
        <p className="mt-1.5 max-w-[60ch] text-ink-2">
          {message} Nothing was analyzed. Check the string, or choose an example compound on the left.
        </p>
      </div>
    </div>
  )
}
