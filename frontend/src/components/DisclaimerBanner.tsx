import { FlaskConical } from 'lucide-react'
import type { ReactNode } from 'react'

export function DisclaimerBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-900 px-4 py-3 text-sm">
      <FlaskConical size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
