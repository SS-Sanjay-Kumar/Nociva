import { NavLink, Route, HashRouter, Routes } from 'react-router-dom'
import { Dna, FlaskConical, Pill } from 'lucide-react'
import { MedicationReviewPage } from './pages/MedicationReviewPage'
import { MolecularExplorerPage } from './pages/MolecularExplorerPage'

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Dna size={20} className="text-indigo-600" />
              GeneCollision
            </div>
            <nav className="flex gap-1">
              <NavTab to="/" icon={<Pill size={15} />} label="Medication Review" />
              <NavTab to="/molecular" icon={<FlaskConical size={15} />} label="Molecular Explorer" />
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<MedicationReviewPage />} />
            <Route path="/molecular" element={<MolecularExplorerPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}

function NavTab({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          isActive ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

export default App
