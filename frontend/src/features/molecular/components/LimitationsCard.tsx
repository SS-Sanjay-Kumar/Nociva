import { ChevronRight, Info } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'

export function LimitationsCard({ limitations }: { limitations: string[] }) {
  return (
    <Card>
      <CardHeader>
        <Info size={18} />
        <CardTitle className="flex-1">Limitations and applicability</CardTitle>
      </CardHeader>
      <div className="p-4">
        <ul className="flex flex-col gap-2.5">
          {limitations.map((t, i) => (
            <li key={i} className="flex gap-2.5 text-[13.5px] text-ink-2">
              <ChevronRight size={14} className="mt-0.5 flex-none text-ink-3" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
