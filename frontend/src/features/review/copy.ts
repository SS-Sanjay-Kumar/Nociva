/**
 * Safety-critical copy, hard-coded here per NOCIVA_HANDOFF.md section 7.
 * These strings are rendered unconditionally for their evidence status and are
 * NEVER derived from backend or mock verdict text, so a careless fixture change
 * can't accidentally soften or remove a safety callout.
 */
export const COPY = {
  verdict: {
    found: { title: 'Association found' },
    none: {
      title: 'No documented association found',
      callout:
        'This is not a safety finding. The rule set covers a limited number of curated associations. ' +
        'No entry means the engine has nothing to report, not that this combination has been shown to be safe.',
    },
    insufficient: {
      title: 'Insufficient evidence',
      callout:
        'An unresolved result is not reassurance. The engine could not reach a documented answer for this ' +
        'patient and medication list.',
    },
  },
  idle: {
    footer: 'Verdicts come from a deterministic rules engine. Machine-learning output is never used.',
  },
  error: {
    live: 'No verdict was produced. This is not a "no association" result. Start the backend (see DEMO.md), then try again.',
    title: 'Rules engine unreachable',
    body:
      'The assessment service did not respond, so no verdict was produced. This is not a "no association" ' +
      'result. Check that the backend is running, then try again.',
  },
  footerSynthetic:
    'All patients, genotypes and outputs are synthetic demonstration data. Nociva is a hackathon ' +
    'prototype, not a medical device, and must not inform clinical decisions.',
} as const
