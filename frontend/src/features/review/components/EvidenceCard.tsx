import { useState } from 'react'
import { BookOpen, ExternalLink } from 'lucide-react'
import type { Association, EvidenceReference, LiteratureLink } from '../../../types'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { Fine } from '../../../components/ui/Misc'

/** Plain-text guideline quote, clamped to ~4 lines with an accessible toggle. */
function Quote({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 280
  return (
    <div className="mt-1.5">
      <blockquote
        className={`border-l-2 border-line-2 pl-3 text-[13px] leading-snug text-ink-2 ${long && !open ? 'line-clamp-4' : ''}`}
      >
        {text}
      </blockquote>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="mt-1 text-[12.5px] text-teal-700 underline"
        >
          {open ? 'Show less' : 'Show full text'}
        </button>
      )}
    </div>
  )
}

function uniqueLiterature(associations: Association[]) {
  // One entry per PMID; "associated" outranks "ambiguous" when both appear.
  const seen = new Map<string, LiteratureLink>()
  for (const a of associations) {
    for (const l of a.literature ?? []) {
      const prev = seen.get(l.pmid)
      if (!prev || (prev.status !== 'associated' && l.status === 'associated')) seen.set(l.pmid, l)
    }
  }
  return [...seen.values()].sort((x, y) => Number(y.pmid) - Number(x.pmid))
}

export function EvidenceCard({
  references,
  associations = [],
}: {
  references: EvidenceReference[]
  associations?: Association[]
}) {
  const literature = uniqueLiterature(associations)
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
              {ref.annotationVersion && (
                <div className="mt-0.5 text-[12px] text-ink-3">
                  ClinPGx annotation v{ref.annotationVersion}
                  {ref.lastUpdated ? ` · last updated ${ref.lastUpdated}` : ''}
                </div>
              )}
              {ref.quote && <Quote text={ref.quote} />}
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
        {literature.length > 0 && (
          <div className="mt-3 border-t border-line-2 pt-3 text-[12.5px]">
            <span className="font-semibold">Background reading (PubMed): </span>
            {literature.map((l, i) => (
              <span key={l.pmid}>
                {i > 0 && ', '}
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">
                  PMID {l.pmid}
                </a>
                {l.status && <span className="text-ink-3"> ({l.status})</span>}
              </span>
            ))}
            <Fine>Related literature, not a clinical recommendation.</Fine>
          </div>
        )}
      </div>
    </Card>
  )
}
