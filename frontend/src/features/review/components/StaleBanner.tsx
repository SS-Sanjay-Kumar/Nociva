import { Clock } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

export function StaleBanner({ onRerun }: { onRerun: () => void }) {
  return (
    <div role="status" className="flex flex-wrap items-center gap-2.5 rounded-[10px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13.5px] text-amber-800">
      <Clock size={16} />
      <span className="flex-1">Inputs changed after this assessment. The result below is out of date.</span>
      <Button size="sm" onClick={onRerun}>
        Run again
      </Button>
    </div>
  )
}
