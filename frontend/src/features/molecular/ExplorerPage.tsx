import { ExperimentalBanner } from './components/ExperimentalBanner'

/**
 * Temporary stub so the app builds through Gate 1. The full Molecular
 * Explorer re-skin (input card, query structure, neighbours, ML prediction,
 * limitations) is Gate 2 work — do not expand this further until then.
 */
export function ExplorerPage() {
  return (
    <div className="mx-auto flex max-w-[1380px] flex-col gap-5 px-4 py-6 min-[721px]:px-6">
      <h1 className="font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] min-[721px]:text-[26px]">
        Molecular explorer
      </h1>
      <ExperimentalBanner />
      <p className="text-ink-3">Full explorer re-skin is Gate 2.</p>
    </div>
  )
}
