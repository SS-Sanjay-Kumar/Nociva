import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EvidenceCard } from './EvidenceCard'

const longQuote = 'Synthetic quote text. '.repeat(30)

describe('EvidenceCard', () => {
  it('shows version, quote toggle and literature links as plain text', async () => {
    render(
      <EvidenceCard
        references={[
          {
            source: 'CPIC',
            citation: 'Synthetic annotation',
            guidelineId: 'X1',
            annotationVersion: '3',
            lastUpdated: '2022-02-10',
            quote: longQuote + '<b>not html</b>',
          },
        ]}
        associations={[
          {
            ruleId: 'GG-A-B',
            kind: 'gene_drug',
            gene: 'A',
            medication: 'b',
            guidelineIds: ['X1'],
            literature: [
              { pmid: '5', url: 'https://pubmed.ncbi.nlm.nih.gov/5/' },
              { pmid: '9', url: 'https://pubmed.ncbi.nlm.nih.gov/9/' },
            ],
          },
        ]}
      />,
    )
    expect(screen.getByText(/ClinPGx annotation v3 · last updated 2022-02-10/)).toBeTruthy()
    expect(document.querySelector('blockquote b')).toBeNull()
    const toggle = screen.getByRole('button', { name: 'Show full text' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Show less' }).getAttribute('aria-expanded')).toBe('true')

    const links = screen.getAllByRole('link', { name: /PMID/ })
    expect(links.map((l) => l.textContent)).toEqual(['PMID 9', 'PMID 5'])
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer')
    expect(links[0].getAttribute('target')).toBe('_blank')
    expect(screen.getByText('Related literature, not a clinical recommendation.')).toBeTruthy()
  })

  it('renders without literature or quote', () => {
    render(<EvidenceCard references={[{ source: 'CPIC', citation: 'c' }]} />)
    expect(screen.queryByText(/Background reading/)).toBeNull()
  })
})
