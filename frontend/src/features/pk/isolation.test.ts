import { describe, expect, it } from 'vitest'
import lintConfig from '../../../.oxlintrc.json'

const raw = import.meta.glob('/src/features/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const FEATURES = ['pk', 'review', 'molecular'] as const

describe('feature isolation', () => {
  for (const from of FEATURES) {
    for (const to of FEATURES.filter((f) => f !== from)) {
      it(`features/${from} has no import path into features/${to}`, () => {
        const offenders = Object.entries(raw)
          .filter(([path]) => path.startsWith(`/src/features/${from}/`))
          .filter(([, src]) => new RegExp(`from\\s+['"][^'"]*/${to}/`).test(src) || new RegExp(`import\\(['"][^'"]*/${to}/`).test(src))
          .map(([path]) => path)
        expect(offenders).toEqual([])
      })
    }
  }

  it('the oxlint config restricts every feature from the other two', () => {
    for (const from of FEATURES) {
      const override = lintConfig.overrides.find((o) => o.files.includes(`**/features/${from}/**`))!
      const rule = override.rules['no-restricted-imports'][1] as { patterns: { group: string[] }[] }
      const groups = rule.patterns.flatMap((p) => p.group)
      for (const to of FEATURES.filter((f) => f !== from)) expect(groups).toContain(`**/${to}/**`)
    }
  })
})
