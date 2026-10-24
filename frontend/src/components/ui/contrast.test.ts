import { describe, expect, it } from 'vitest'

/**
 * axe-core's color-contrast rule cannot run meaningfully in these tests:
 * jsdom has no real paint/layout engine, so getComputedStyle never
 * resolves Tailwind's compiled colors, and axe reports "incomplete" (not
 * pass, not fail) for every element — verified directly: rendering a Chip
 * and inspecting axe's raw results shows color-contrast in
 * `results.incomplete`, never in `results.passes` or `results.violations`.
 * `toHaveNoViolations()` would still report green, which would be a false
 * "verified" claim.
 *
 * This file computes real WCAG 2.1 contrast ratios from the actual hex
 * values in src/index.css's @theme block against the actual class pairs
 * in Chip.tsx, so a real pass/fail exists for the exact colors shipped,
 * independent of jsdom's rendering limitations. Keep in sync with both
 * files if either changes — a mismatch here means this test is checking
 * the wrong colors, not that the UI is fine.
 */

// Mirror of src/index.css's @theme token values.
const TOKENS: Record<string, string> = {
  'navy-900': '#0b1f3a',
  'navy-700': '#1d3b66',
  'navy-300': '#9fb3cc',
  'navy-200': '#c4d2e3',
  'ink-2': '#34485f',
  'ink-3': '#5c6e85',
  surface: '#ffffff',
  'surface-2': '#f7f9fc',
  'teal-700': '#0b6f72',
  'teal-500': '#13a1a3',
  'teal-50': '#eaf6f6',
  'amber-800': '#7a4306',
  'amber-50': '#fff7e6',
  'exp-800': '#3f3590',
  'exp-300': '#b7aee6',
  'exp-200': '#d5cff1',
  'exp-50': '#f4f2fd',
  'crit-700': '#a61e14',
  'crit-50': '#fef2f1',
  'slate-100': '#e9eef7',
}

function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)) as [number, number, number]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/** WCAG 2.1 contrast ratio between two hex colors, 1:1 to 21:1. */
function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA))
  const lB = relativeLuminance(hexToRgb(hexB))
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA]
  return (lighter + 0.05) / (darker + 0.05)
}

function blend(bgHex: string, fgHex: string, alpha: number): string {
  const bg = hexToRgb(bgHex)
  const fg = hexToRgb(fgHex)
  const mixed = bg.map((c, i) => Math.round(fg[i] * alpha + c * (1 - alpha)))
  return '#' + mixed.map((c) => c.toString(16).padStart(2, '0')).join('')
}

const WCAG_AA_NORMAL_TEXT = 4.5

describe('Chip variant text/background contrast (real WCAG AA check)', () => {
  // [variant, text token, background token]
  const chipPairs: [string, string, string][] = [
    ['default', 'ink-2', 'surface-2'],
    ['teal', 'teal-700', 'teal-50'],
    ['amber', 'amber-800', 'amber-50'],
    ['navy', 'navy-700', 'slate-100'],
    ['exp', 'exp-800', 'exp-50'],
    ['miss', 'ink-3', 'surface'],
    ['crit', 'crit-700', 'crit-50'],
  ]

  it.each(chipPairs)('%s chip clears WCAG AA (4.5:1) for normal text', (_variant, textToken, bgToken) => {
    const ratio = contrastRatio(TOKENS[textToken], TOKENS[bgToken])
    expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
  })
})

describe('Sidebar (navy-900, opacity-blended) text contrast', () => {
  const navy900 = TOKENS['navy-900']

  it('EXP tag text (exp-200) on its 15%-opacity exp-300 chip background clears AA', () => {
    const bg = blend(navy900, TOKENS['exp-300'], 0.15)
    expect(contrastRatio(TOKENS['exp-200'], bg)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
  })

  it('active nav item white text on its 18%-opacity teal-500 highlight clears AA', () => {
    const bg = blend(navy900, TOKENS['teal-500'], 0.18)
    expect(contrastRatio('#ffffff', bg)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
  })

  it('inactive nav item text (navy-200) directly on navy-900 clears AA', () => {
    expect(contrastRatio(TOKENS['navy-200'], navy900)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
  })

  it('evidence key body text (navy-300) directly on navy-900 clears AA', () => {
    expect(contrastRatio(TOKENS['navy-300'], navy900)).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT)
  })
})
