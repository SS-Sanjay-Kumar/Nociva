import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Sidebar } from './components/shell/Sidebar'
import { Topbar } from './components/shell/Topbar'
import { ReviewPage } from './features/review/ReviewPage'
import { ExplorerPage } from './features/molecular/ExplorerPage'

// Lazy: Recharts and the PK feature load only when #/pk is opened.
const PkPage = lazy(() => import('./features/pk/PkPage'))

function Shell() {
  const { pathname } = useLocation()
  const title =
    pathname === '/molecular' ? 'Molecular explorer' : pathname === '/pk' ? 'Pharmacokinetic Simulator' : 'Medication review'

  return (
    <div className="grid min-h-screen min-[1101px]:grid-cols-[248px_minmax(0,1fr)] min-[721px]:max-[1100px]:grid-cols-[72px_minmax(0,1fr)] max-[720px]:grid-cols-1">
      <Sidebar />
      <div className="min-w-0">
        <Topbar title={title} variant={pathname === '/pk' ? 'pk' : 'review'} />
        <Routes>
          <Route path="/" element={<ReviewPage />} />
          <Route path="/molecular" element={<ExplorerPage />} />
          <Route
            path="/pk"
            element={
              <Suspense fallback={<p className="px-6 py-6 text-ink-3">Loading simulator…</p>}>
                <PkPage />
              </Suspense>
            }
          />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}

export default App
