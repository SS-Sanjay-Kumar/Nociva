import { cloneElement, isValidElement } from 'react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expectNoA11yViolations } from '../../testing/a11y'
import { PkPage } from './PkPage'
import { alteredLegend, buildChartData } from './components/chartData'
import { SimulateResponseSchema } from '../../contracts/pk'
import presets from '../../../../docs/contracts/pk-examples/presets.json'
import plain from '../../../../docs/contracts/pk-examples/synthetic-x.response.json'
import withMc from '../../../../docs/contracts/pk-examples/synthetic-x-montecarlo.response.json'

// jsdom has no layout, so ResponsiveContainer would render nothing: give it a fixed size.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement }) => (
      <div style={{ width: 800, height: 400 }}>
        {isValidElement(children) ? cloneElement(children as ReactElement<{ width: number; height: number }>, { width: 800, height: 400 }) : children}
      </div>
    ),
  }
})

afterEach(() => vi.unstubAllGlobals())

const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => body, text: async () => '' })

function stubBackend(simulateBody: unknown = plain) {
  const fn = vi.fn((url: string, _init?: RequestInit) => (url.endsWith('/api/pk/presets') ? ok(presets) : ok(simulateBody)))
  vi.stubGlobal('fetch', fn)
  return fn
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PkPage />
    </MemoryRouter>,
  )
}

describe('PK page', () => {
  it('preselects Synthetic Compound X and auto-runs on load', async () => {
    const fetchMock = stubBackend()
    renderPage()
    await screen.findByRole('img', { name: /Concentration versus time for Synthetic Compound X/ })
    expect((screen.getByLabelText(/Preset/) as HTMLSelectElement).selectedOptions[0].textContent).toBe('Synthetic Compound X')
    const simCall = fetchMock.mock.calls.find((c) => String(c[0]).endsWith('/api/pk/simulate'))!
    expect(JSON.parse((simCall[1] as RequestInit).body as string).doseMg).toBe(100)
    expect(screen.getByText(/Research demonstration with synthetic parameters\. Not a clinical dosing or toxicity tool\./)).toBeTruthy()
  })

  it('shows a plain message and no curves when the service is down', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    renderPage()
    expect(await screen.findByText('PK service is not running')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Retry/ })).toBeTruthy()
    expect(screen.queryByRole('img', { name: /Concentration versus time/ })).toBeNull()
    expect(document.querySelector('.recharts-line')).toBeNull()
  })

  it('shows no curves when simulate fails after presets load', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => (url.endsWith('/api/pk/presets') ? ok(presets) : Promise.reject(new TypeError('Failed to fetch')))),
    )
    renderPage()
    expect(await screen.findByText('PK service is not running')).toBeTruthy()
    expect(screen.queryByRole('img', { name: /Concentration versus time/ })).toBeNull()
  })

  it('shows the contract error pane for a broken response', async () => {
    stubBackend({ ...plain, timeHours: 'oops' })
    renderPage()
    expect(await screen.findByText('Unexpected response from service')).toBeTruthy()
    expect(screen.queryByRole('img', { name: /Concentration versus time/ })).toBeNull()
  })

  it('blocks Run and shows inline messages for invalid values', async () => {
    const fetchMock = stubBackend()
    renderPage()
    await screen.findByRole('img', { name: /Concentration versus time/ })
    const calls = fetchMock.mock.calls.length
    const dose = screen.getByLabelText(/^Dose/)
    await userEvent.clear(dose)
    await userEvent.type(dose, '-5')
    await userEvent.click(screen.getByRole('button', { name: /Run simulation/ }))
    expect(await screen.findByText(/Dose must be a number from 0 to 10000 mg/)).toBeTruthy()
    expect(fetchMock.mock.calls.length).toBe(calls)
  })

  it('data table has one row per response time point and labels the altered series hypothetical', async () => {
    stubBackend()
    renderPage()
    await screen.findByRole('img', { name: /Concentration versus time/ })
    await userEvent.click(screen.getByRole('button', { name: 'View data table' }))
    const region = screen.getByRole('region', { name: 'Plotted values table' })
    const bodyRows = within(region).getAllByRole('row').length - 1
    expect(bodyRows).toBe(plain.timeHours.length)
    expect(within(region).getByRole('columnheader', { name: /\(hypothetical\) \(mg\/L\)/ })).toBeTruthy()
  })

  it('shows Monte Carlo bands only with the demonstration label', async () => {
    stubBackend(withMc)
    renderPage()
    await screen.findByRole('img', { name: /Concentration versus time/ })
    expect(screen.getByText(/Assumed demonstration distribution, not a validated\s+interval/)).toBeTruthy()
    expect(screen.getByText(/Assumed demonstration distributions; not a validated prediction interval/)).toBeTruthy()
  })

  it('renders metrics from the response and the interpretation panel', async () => {
    stubBackend()
    renderPage()
    await screen.findByRole('img', { name: /Concentration versus time/ })
    const cmax = screen.getByTestId('metric-Cmax')
    expect(cmax.textContent).toContain(plain.baseline.metrics.cmaxMgPerL.toFixed(3))
    expect(cmax.textContent).toContain(plain.altered.metrics.cmaxMgPerL.toFixed(3))
    expect(screen.getByTestId('metric-Relative AUC change').textContent).toContain('+38.6%')
    expect(screen.getByText(plain.interpretation)).toBeTruthy()
    expect(screen.getByText('Synthetic')).toBeTruthy()
    expect(screen.getByText('Not clinically validated')).toBeTruthy()
  })

  it('has no accessibility violations', async () => {
    stubBackend(withMc)
    const { container } = renderPage()
    await screen.findByRole('img', { name: /Concentration versus time/ })
    await waitFor(() => expect(container.querySelector('.recharts-wrapper')).toBeTruthy())
    await expectNoA11yViolations(container)
  })
})

describe('chart data', () => {
  it('always labels the altered series as hypothetical, whatever the user label is', () => {
    const r = SimulateResponseSchema.parse({ ...plain, altered: { ...plain.altered, label: 'Anything' } })
    expect(alteredLegend(r)).toBe('Anything (hypothetical)')
    expect(alteredLegend(SimulateResponseSchema.parse({ ...plain, altered: undefined }))).toBeNull()
  })

  it('builds one row per time point straight from the response', () => {
    const r = SimulateResponseSchema.parse(withMc)
    const rows = buildChartData(r)
    expect(rows).toHaveLength(r.timeHours.length)
    expect(rows[10].baseline).toBe(r.baseline.concentrationMgPerL[10])
    expect(rows[10].baselineBand).toEqual([r.monteCarlo!.baseline.concentrationBands.p5[10], r.monteCarlo!.baseline.concentrationBands.p95[10]])
  })
})
