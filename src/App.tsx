import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Tracker from './pages/Tracker'
import Import from './pages/Import'
import NetWorth from './pages/NetWorth'
import Categories from './pages/settings/Categories'
import ImportMappings from './pages/settings/ImportMappings'
import NetWorthSettings from './pages/settings/NetWorth'

function ChevronLeftIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4L6 8l4 4" />
    </svg>
  )
}


export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    localStorage.getItem('sidebarOpen') !== 'false'
  )

  function toggleSidebar() {
    setSidebarOpen(prev => {
      localStorage.setItem('sidebarOpen', String(!prev))
      return !prev
    })
  }

  return (
    <div className="flex h-screen bg-bg font-sans overflow-hidden">

      {/* Sidebar wrapper — flex so aside stretches to full height inside */}
      <div className="relative shrink-0 flex">
        {/* Width-animated clip around sidebar */}
        <div className={`overflow-hidden flex transition-[width] duration-300 ease-in-out ${sidebarOpen ? 'w-[260px]' : 'w-0'}`}>
          <Sidebar />
        </div>

        {/* Collapse button — hover zone straddling the right border, vertically centered */}
        {sidebarOpen && (
          <div className="group/collapse absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30 w-10 h-24 flex items-center justify-center">
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 rounded-full bg-surface border border-border shadow-md flex items-center justify-center text-ink-muted hover:text-ink opacity-0 group-hover/collapse:opacity-100 transition-all duration-150 hover:scale-105 cursor-pointer"
              aria-label="Collapse sidebar"
            >
              <ChevronLeftIcon />
            </button>
          </div>
        )}
      </div>

      {/* Expand strip — full-height hover zone on left edge when sidebar is closed */}
      {!sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="group/expand fixed left-0 inset-y-0 w-8 z-50 flex items-center justify-center cursor-pointer"
        >
          {/* Fading container strip */}
          <div className="absolute inset-0 opacity-0 group-hover/expand:opacity-100 transition-opacity duration-200 bg-bg border-r border-border" />
          {/* Bottom-to-top text */}
          <span
            className="relative opacity-0 group-hover/expand:opacity-100 transition-opacity duration-200 text-[11px] font-semibold tracking-[0.25em] text-ink-muted uppercase select-none whitespace-nowrap"
            style={{ transform: 'rotate(-90deg)' }}
          >
            Expand Sidebar
          </span>
        </div>
      )}

      <main className="flex-1 min-w-0 overflow-auto">
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
