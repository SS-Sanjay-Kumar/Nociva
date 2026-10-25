import { axe } from 'vitest-axe'

/**
 * Asserts zero accessibility violations for a rendered container.
 *
 * Not using vitest-axe's own expect.extend()-based matcher: its
 * 'vitest-axe/extend-expect' entry point is a 0-byte file (verified by
 * reading it — it silently registers nothing), and importing its matcher
 * by value from 'vitest-axe/matchers' fails to typecheck under
 * verbatimModuleSyntax (the package's .d.ts re-export chain confuses it
 * into "resolves to a type-only declaration"), and even a manual
 * `declare module 'vitest' { interface Assertion ... }` augmentation
 * can't satisfy "all declarations of 'Assertion' must have identical type
 * parameters" against vitest's own merged-interface definition. A plain
 * assertion function sidesteps all of it with identical behaviour.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe(container)
  const violations = results.violations
  if (violations.length > 0) {
    const detail = violations
      .map((v) => `- [${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n  ${v.helpUrl}`)
      .join('\n')
    throw new Error(`Expected no accessibility violations but found ${violations.length}:\n${detail}`)
  }
}
