import { Routes, Route, Navigate } from 'react-router-dom'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Tracker from './pages/Tracker'
import Categories from './pages/settings/Categories'
import { supabaseConfigured } from './lib/supabase'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      {!supabaseConfigured && (
        <div className="fixed top-0 inset-x-0 z-[60] bg-red-600 text-white text-sm text-center py-2 px-4">
          Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel project settings, then redeploy.
        </div>
      )}
      <Nav />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/settings" element={<Navigate to="/settings/categories" replace />} />
          <Route path="/settings/categories" element={<Categories />} />
        </Routes>
      </main>
    </div>
  )
}
