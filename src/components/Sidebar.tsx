import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Three-stone Cairn mark — 64×64 viewBox, scaled via width/height
// variant="color": terra/forest/amber; variant="mono": all white (for terra tile)
function CairnMark({ size = 20, variant = 'color' }: { size?: number; variant?: 'color' | 'mono' }) {
  const bottom = variant === 'mono' ? 'white' : 'var(--terra)'
  const middle = variant === 'mono' ? 'white' : 'var(--forest)'
  const top    = variant === 'mono' ? 'white' : 'var(--amber)'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="12" y="36" width="40" height="14" rx="7" fill={bottom} />
      <rect x="18" y="20" width="28" height="14" rx="7" fill={middle} />
      <rect x="24" y="4"  width="16" height="14" rx="7" fill={top} />
    </svg>
  )
}

// Stroke icons — 16×16 viewBox, currentColor stroke
const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg
    width={16} height={16} viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0 block"
  >
    {children}
  </svg>
)

const NetWorthIcon     = () => <Icon><path d="M3 13h10M5 13V8M8 13V4M11 13V9" /></Icon>
const DashboardIcon    = () => <Icon><rect x="2.5" y="2.5" width="5" height="5" rx="1"/><rect x="8.5" y="2.5" width="5" height="5" rx="1"/><rect x="2.5" y="8.5" width="5" height="5" rx="1"/><rect x="8.5" y="8.5" width="5" height="5" rx="1"/></Icon>
const TransactionsIcon = () => <Icon><path d="M3 5h7l-2-2M13 11H6l2 2" /></Icon>
const ImportIcon       = () => <Icon><path d="M8 2v8M5 7l3 3 3-3M3 13h10" /></Icon>
const SettingsIcon     = () => <Icon><circle cx="8" cy="8" r="2" /><path d="M8 1v2M8 13v2M15 8h-2M3 8H1M13 3l-1.4 1.4M4.4 11.6L3 13M13 13l-1.4-1.4M4.4 4.4L3 3" /></Icon>

type NavItemDef = {
  to: string
  label: string
  Icon: () => JSX.Element
  end?: boolean
}

const overviewItems: NavItemDef[] = [
  { to: '/net-worth', label: 'Net Worth',    Icon: NetWorthIcon },
  { to: '/dashboard', label: 'Dashboard',    Icon: DashboardIcon },
  { to: '/tracker',   label: 'Transactions', Icon: TransactionsIcon },
]

const manageItems: NavItemDef[] = [
  { to: '/import',   label: 'Import',   Icon: ImportIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon, end: false },
]

export default function Sidebar() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  function toggleTheme(to: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', to === 'dark')
    setDark(to === 'dark')
  }

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : '—'

  return (
    <aside className="w-[232px] shrink-0 flex flex-col gap-0.5 px-3 py-[22px] bg-bg">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-3 pb-[22px]">
        <div
          className="w-8 h-8 rounded-[10px] bg-terra flex items-center justify-center shrink-0"
          style={{ boxShadow: '0 2px 8px rgba(198,107,70,0.30)' }}
        >
          <CairnMark size={18} variant="mono" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-[15px] text-ink tracking-tight whitespace-nowrap">
            Cairn
          </div>
          <div className="text-[10.5px] font-medium text-ink-faint uppercase tracking-[0.08em] -mt-0.5 whitespace-nowrap">
            Personal Finance Hub
          </div>
        </div>
      </div>

      {/* Overview group */}
      <SectionLabel>Overview</SectionLabel>
      {overviewItems.map(item => <SidebarItem key={item.to} item={item} />)}

      {/* Manage group */}
      <SectionLabel className="mt-[18px]">Manage</SectionLabel>
      {manageItems.map(item => <SidebarItem key={item.to} item={item} />)}

      {/* Footer */}
      <div className="mt-auto pt-4 px-1.5 flex flex-col gap-3">
        {/* Theme toggle */}
        <div className="flex items-center p-[3px] rounded-full bg-surface-alt">
          <ToggleHalf active={!dark} label="Light" icon="☀" onClick={() => toggleTheme('light')} />
          <ToggleHalf active={dark}  label="Dark"  icon="☾" onClick={() => toggleTheme('dark')} />
        </div>

        {/* User chip */}
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-surface border border-border shadow-card">
          <div
            className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-semibold"
            style={{ background: 'linear-gradient(135deg, var(--terra), var(--forest))' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-medium text-ink truncate">
              {userEmail ?? '—'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[10.5px] text-ink-faint uppercase tracking-eyebrow font-medium px-3.5 py-1.5 ${className}`}>
      {children}
    </div>
  )
}

function SidebarItem({ item }: { item: NavItemDef }) {
  return (
    <NavLink
      to={item.to}
      end={item.end !== false}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13.5px] transition-colors border ${
          isActive
            ? 'bg-surface shadow-card border-border text-ink font-medium'
            : 'border-transparent text-ink-muted hover:bg-surface-alt'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-terra' : 'text-ink-muted'}>
            <item.Icon />
          </span>
          <span className="flex-1 min-w-0 truncate">{item.label}</span>
          {isActive && (
            <span className="w-1 h-1 rounded-full bg-terra ml-auto shrink-0" />
          )}
        </>
      )}
    </NavLink>
  )
}

function ToggleHalf({
  active, label, icon, onClick,
}: {
  active: boolean; label: string; icon: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1 py-[5px] px-2 rounded-full text-[11.5px] font-medium transition-colors ${
        active ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
      }`}
    >
      <span className="text-[12px]">{icon}</span>
      {label}
    </button>
  )
}
