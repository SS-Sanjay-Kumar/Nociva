import { NavLink } from 'react-router-dom'
import { Activity, FlaskConical, LineChart } from 'lucide-react'
import { Logo } from './Logo'

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen flex-col gap-6 overflow-auto bg-navy-900 px-4 pb-4 pt-5 text-navy-200 min-[721px]:self-start max-[720px]:static max-[720px]:h-auto max-[720px]:gap-2 max-[720px]:overflow-x-auto max-[720px]:px-4 max-[720px]:py-2.5 min-[721px]:max-[1100px]:items-center min-[721px]:max-[1100px]:px-2.5">
      <div className="flex items-center gap-2.5 px-1.5 py-1 text-white max-[720px]:p-0">
        <Logo />
        <span className="min-[721px]:max-[1100px]:hidden font-display text-lg font-extrabold tracking-[-0.015em] max-[720px]:inline">
          Gene<b className="font-extrabold text-teal-300">Collision</b>
        </span>
      </div>

      {/* On phones the three destinations share one full-width row, so none is clipped or off-screen. */}
      <nav aria-label="Primary" className="flex flex-col gap-1 max-[720px]:w-full max-[720px]:flex-row">
        <NavItem to="/" icon={<Activity size={18} />} label="Medication review" shortLabel="Review" />
        <NavItem
          to="/molecular"
          icon={<FlaskConical size={18} />}
          label="Molecular explorer"
          shortLabel="Molecular"
          tag="EXP"
          tagTitle="Experimental"
          tagVariant="exp"
        />
        <NavItem
          to="/pk"
          icon={<LineChart size={18} />}
          label="PK simulation"
          shortLabel="PK"
          tag="SIM"
          tagTitle="Simulation (experimental)"
          tagVariant="exp"
        />
      </nav>

      <div className="mt-auto flex flex-col gap-3 rounded-xl border border-white/10 p-3.5 text-xs text-navy-300 min-[721px]:max-[1100px]:hidden max-[720px]:hidden">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.07em] text-navy-200">Evidence key</h4>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 h-4 w-4 flex-none rounded-[5px] bg-teal-500" />
          <span>
            <b className="block font-semibold text-white">Clinical assessment</b>
            Deterministic rules and cited evidence.
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 h-4 w-4 flex-none rounded-[5px] border-[1.5px] border-dashed border-exp-300 bg-exp-300/15" />
          <span>
            <b className="block font-semibold text-white">Experimental</b>
            Computational output. Not clinical evidence.
          </span>
        </div>
      </div>
    </aside>
  )
}

function NavItem({
  to,
  icon,
  label,
  shortLabel,
  tag,
  tagTitle,
  tagVariant,
  disabled,
}: {
  to?: string
  icon: React.ReactNode
  label: string
  /** Shown instead of `label` on phones, where three items share one row. */
  shortLabel?: string
  tag?: string
  tagTitle?: string
  tagVariant?: 'exp' | 'soon'
  disabled?: boolean
}) {
  const content = (isActive: boolean) => (
    <>
      <span className="shrink-0">{icon}</span>
      <span className={`min-w-0 flex-1 truncate min-[721px]:max-[1100px]:hidden ${shortLabel ? 'max-[720px]:hidden' : 'max-[720px]:inline'}`}>{label}</span>
      {shortLabel && <span className="hidden min-w-0 truncate max-[720px]:inline">{shortLabel}</span>}
      {tag && (
        <span
          title={tagTitle ?? tag}
          aria-label={tagTitle ?? tag}
          className={`ml-auto flex-none whitespace-nowrap min-[721px]:max-[1100px]:hidden max-[720px]:hidden rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${
            tagVariant === 'exp'
              ? 'border border-dashed border-exp-300/65 bg-exp-300/15 text-exp-200'
              : 'bg-white/10 text-navy-300'
          }`}
        >
          {tag}
        </span>
      )}
      {isActive && null}
    </>
  )

  const className = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left font-medium text-navy-200 min-[721px]:max-[1100px]:w-auto min-[721px]:max-[1100px]:justify-center min-[721px]:max-[1100px]:px-3 max-[720px]:w-auto max-[720px]:flex-1 max-[720px]:justify-center max-[720px]:px-2 max-[720px]:whitespace-nowrap ${
      isActive ? 'bg-teal-500/18 text-white shadow-[inset_0_0_0_1px_rgba(95,211,208,0.3)]' : 'hover:bg-white/6 hover:text-white'
    } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`

  if (disabled || !to) {
    return (
      <button type="button" disabled title={label} className={className({ isActive: false })}>
        {content(false)}
      </button>
    )
  }

  return (
    <NavLink to={to} title={label} aria-label={label} end className={({ isActive }) => className({ isActive })}>
      {({ isActive }) => content(isActive)}
    </NavLink>
  )
}
