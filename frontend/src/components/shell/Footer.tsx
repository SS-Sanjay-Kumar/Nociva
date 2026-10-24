import { Info } from 'lucide-react'

export function Footer() {
  return (
    <div className="flex items-start gap-2 pt-1 text-xs text-ink-3">
      <Info size={14} className="mt-0.5 flex-none" />
      <span>
        All patients, genotypes and outputs are synthetic demonstration data. GeneCollision is a hackathon
        prototype, not a medical device, and must not inform clinical decisions.
      </span>
    </div>
  )
}
