import { CircleHelp, Info, Search, ShieldCheck, TriangleAlert } from 'lucide-react'
import type { AssessmentResult, EvidenceStatus, PatientProfile } from '../../../types'
import { COPY } from '../copy'

const ICON = { association_found: TriangleAlert, no_documented_association: Search, insufficient_evidence: CircleHelp } as const

const SURFACE: Record<EvidenceStatus, string> = {
  association_found: 'bg-amber-50 border-amber-200',
  no_documented_association: 'bg-[#EEF2F7] border-slate-300',
  insufficient_evidence: 'bg-surface border-[1.5px] border-dashed border-[#9FB0C6]',
}

const ICON_TONE: Record<EvidenceStatus, string> = {
  association_found: 'bg-amber-100 text-amber-800',
  no_documented_association: 'bg-slate-200 text-navy-700',
  insufficient_evidence: 'bg-slate-200 text-navy-700',
}

const TITLE: Record<EvidenceStatus, string> = {
  association_found: COPY.verdict.found.title,
  no_documented_association: COPY.verdict.none.title,
  insufficient_evidence: COPY.verdict.insufficient.title,
}

export function VerdictCard({ result, patient }: { result: AssessmentResult; patient: PatientProfile }) {
  const { verdict, medications } = result
  const Icon = ICON[verdict.evidenceStatus]
  const d6 = patient.genotypes.find((g) => g.gene === 'CYP2D6')

  return (
    <section
      aria-labelledby="verdict-title"
      className={`flex flex-col gap-4 rounded-[var(--radius-lg)] border p-5 ${SURFACE[verdict.evidenceStatus]}`}
    >
      <div className="flex items-start gap-4">
        <div className={`grid h-[52px] w-[52px] flex-none place-items-center rounded-2xl ${ICON_TONE[verdict.evidenceStatus]}`}>
          <Icon size={26} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">
            <ShieldCheck size={14} />
            Deterministic clinical assessment
          </div>
          <h2 id="verdict-title" className="my-1.5 font-display text-[28px] font-extrabold leading-[1.12] tracking-[-0.02em] min-[560px]:text-[30px]">
            {TITLE[verdict.evidenceStatus]}
          </h2>
          <p className="max-w-[64ch] text-[15px] text-ink-2">{verdict.summary}</p>
        </div>
      </div>

      {verdict.evidenceStatus === 'no_documented_association' && (
        <SafetyCallout text={COPY.verdict.none.callout} />
      )}
      {verdict.evidenceStatus === 'insufficient_evidence' && (
        <SafetyCallout text={COPY.verdict.insufficient.callout} />
      )}

      {/*
        `recommendation` is never populated by the mock fixtures (see
        features/review/mocks/assessments.ts) — only a future backend
        supplying real guideline text would cause this to render, labelled
        "Guideline text" rather than "Recommendation" so it reads as a
        citation, not frontend-authored clinical advice.
      */}
      {verdict.recommendation && (
        <p className="rounded-md bg-white/60 px-3 py-2 text-sm text-ink">
          <span className="font-medium">Guideline text: </span>
          {verdict.recommendation}
        </p>
      )}

      <dl className="grid grid-cols-1 gap-3.5 border-t border-black/10 pt-4 min-[560px]:grid-cols-2">
        <MetaItem label="Patient" value={patient.label} sub={`${patient.id} · CYP2D6 ${d6?.diplotype ?? '—'}`} />
        <MetaItem label="Medications evaluated" value={medications.map((m) => m.name).join(' + ')} />
        {verdict.evidenceBasis && <MetaItem label="Evidence basis" value={verdict.evidenceBasis} />}
        {verdict.ruleId && (
          <MetaItem
            label="Rule"
            value={verdict.ruleId}
            mono
            sub={[verdict.engineVersion, verdict.evidenceSnapshot && `snapshot ${verdict.evidenceSnapshot}`].filter(Boolean).join(' · ')}
          />
        )}
      </dl>
    </section>
  )
}

function SafetyCallout({ text }: { text: string }) {
  const [bold, ...rest] = text.split('. ')
  return (
    <div role="note" className="flex gap-2.5 rounded-[10px] border border-slate-300 bg-surface px-3.5 py-3 text-[13.5px]">
      <Info size={16} className="mt-0.5 flex-none text-navy-700" />
      <span>
        <b>{bold}.</b> {rest.join('. ')}
      </span>
    </div>
  )
}

function MetaItem({ label, value, sub, mono }: { label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">{label}</dt>
      <dd className={`mt-0.5 font-medium ${mono ? 'font-mono text-[13px]' : ''}`}>
        {value}
        {sub && <small className="block font-sans font-normal text-ink-3">{sub}</small>}
      </dd>
    </div>
  )
}
