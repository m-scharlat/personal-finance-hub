import { Routes, Route, Navigate } from 'react-router-dom'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Tracker from './pages/Tracker'
import Import from './pages/Import'
import Categories from './pages/settings/Categories'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <Nav />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/import" element={<Import />} />
          <Route path="/settings" element={<Navigate to="/settings/categories" replace />} />
          <Route path="/settings/categories" element={<Categories />} />
        </Routes>
      </main>
    </div>
  )
}
