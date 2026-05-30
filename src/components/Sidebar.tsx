import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string


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
const AdminIcon        = () => <Icon><circle cx="8" cy="5" r="2.5"/><path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5"/><path d="M11.5 9.5l1 1 2-2"/></Icon>
const DashboardIcon    = () => <Icon><rect x="2.5" y="2.5" width="5" height="5" rx="1"/><rect x="8.5" y="2.5" width="5" height="5" rx="1"/><rect x="2.5" y="8.5" width="5" height="5" rx="1"/><rect x="8.5" y="8.5" width="5" height="5" rx="1"/></Icon>
const TransactionsIcon = () => <Icon><path d="M3 5h7l-2-2M13 11H6l2 2" /></Icon>
const ImportIcon       = () => <Icon><path d="M8 2v8M5 7l3 3 3-3M3 13h10" /></Icon>
const SettingsIcon     = () => <Icon><line x1="2" y1="4" x2="14" y2="4" /><circle cx="10" cy="4" r="1.5" /><line x1="2" y1="8" x2="14" y2="8" /><circle cx="5" cy="8" r="1.5" /><line x1="2" y1="12" x2="14" y2="12" /><circle cx="10" cy="12" r="1.5" /></Icon>

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
  const { session } = useAuth()

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    )
    observer.observe(document.documentElement, { attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const user      = session?.user
  const name      = user?.user_metadata?.full_name as string | undefined
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const email     = user?.email
  const isAdmin   = email === ADMIN_EMAIL
  const initials  = name ? name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                         : email ? email.slice(0, 2).toUpperCase() : '—'

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <aside className="w-[260px] shrink-0 flex flex-col gap-0.5 px-3 py-[22px] bg-bg border-r border-border">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-3 pb-[22px]">
        <div
          className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
          style={dark
            ? { background: 'var(--terra)', boxShadow: '0 2px 8px rgba(198,107,70,0.30)' }
            : { background: '#ffffff', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
          }
        >
          <CairnMark size={18} variant={dark ? 'mono' : 'color'} />
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

      {/* Admin — only visible to the app admin */}
      {isAdmin && (
        <>
          <SectionLabel className="mt-[18px]">Admin</SectionLabel>
          <SidebarItem item={{ to: '/admin', label: 'Admin', Icon: AdminIcon }} />
        </>
      )}

      {/* Footer */}
      <div className="mt-auto pt-4 px-1.5">
        {/* User chip — avatar+name links to Profile settings, sign out stays accessible */}
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-surface border border-border shadow-card">
          <NavLink
            to="/settings/profile"
            className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name ?? email ?? ''}
                className="w-7 h-7 rounded-full shrink-0 object-cover"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-semibold"
                style={{ background: 'linear-gradient(135deg, var(--terra), var(--forest))' }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-ink truncate leading-tight">
                {name ?? email ?? '—'}
              </div>
              {name && email && (
                <div className="text-[10.5px] text-ink-faint truncate leading-tight">{email}</div>
              )}
            </div>
          </NavLink>

          <button
            onClick={signOut}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-ink-muted hover:text-red hover:bg-red-soft transition-colors"
            aria-label="Sign out"
          >
            <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10 11l3-3-3-3M13 8H6" />
            </svg>
          </button>
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
