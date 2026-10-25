import { ChevronRight, Minus, TriangleAlert } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'

export function LimitsCard({ missingData, limitations }: { missingData?: string[]; limitations: string[] }) {
  return (
    <Card>
      <CardHeader>
        <TriangleAlert size={18} />
        <CardTitle className="flex-1">Missing data and limitations</CardTitle>
      </CardHeader>
      <div className="p-4">
        {missingData && missingData.length > 0 && (
          <>
            <SubHeading icon={<Minus size={14} />}>Missing data</SubHeading>
            <List items={missingData} />
          </>
        )}
        <SubHeading icon={<ChevronRight size={14} />} className={missingData && missingData.length > 0 ? 'mt-[18px]' : ''}>
          Limitations
        </SubHeading>
        <List items={limitations} />
      </div>
    </Card>
  )
}

function SubHeading({ children, icon, className = '' }: { children: React.ReactNode; icon: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-ink-3 ${className}`}>
      {icon}
      {children}
    </div>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5 text-[13.5px] text-ink-2">
          <ChevronRight size={14} className="mt-0.5 flex-none text-ink-3" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}
