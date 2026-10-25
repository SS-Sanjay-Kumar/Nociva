import { BookOpen, ExternalLink } from 'lucide-react'
import type { EvidenceReference } from '../../../types'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { Fine } from '../../../components/ui/Misc'

export function EvidenceCard({ references }: { references: EvidenceReference[] }) {
  return (
    <Card>
      <CardHeader>
        <BookOpen size={18} />
        <CardTitle className="flex-1">Evidence references</CardTitle>
        <Chip variant="teal">{references.length}</Chip>
      </CardHeader>
      <div className="p-4">
        {references.length === 0 && <Fine>No curated references apply to this result.</Fine>}
        {references.map((ref, i) => (
          <div key={i} className="flex gap-3 border-t border-line-2 py-3 first:border-t-0 first:pt-0">
            <span className="h-fit flex-none rounded-[7px] bg-navy-900 px-2 py-0.5 text-[11px] font-semibold tracking-[0.04em] text-white">
              {ref.source}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold leading-snug">{ref.citation}</div>
              {ref.url && (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] text-teal-700"
                >
                  Open source
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
