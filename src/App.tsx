import { Routes, Route, Navigate } from 'react-router-dom'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Tracker from './pages/Tracker'
import Import from './pages/Import'
import NetWorth from './pages/NetWorth'
import Categories from './pages/settings/Categories'
import ImportMappings from './pages/settings/ImportMappings'
import NetWorthSettings from './pages/settings/NetWorth'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <Nav />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Navigate to="/net-worth" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/net-worth" element={<NetWorth />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/import" element={<Import />} />
          <Route path="/settings" element={<Navigate to="/settings/net-worth" replace />} />
          <Route path="/settings/categories" element={<Categories />} />
          <Route path="/settings/import-mappings" element={<ImportMappings />} />
          <Route path="/settings/net-worth"       element={<NetWorthSettings />} />
        </Routes>
      </main>
    </div>
  )
}
