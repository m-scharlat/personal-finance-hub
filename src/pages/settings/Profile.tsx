import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTour } from '../../contexts/TourContext'
import SettingsNav from '../../components/SettingsNav'
import { supabase } from '../../lib/supabase'

const HELP_SECTIONS = [
  {
    title: 'Net Worth',
    body:  'Add your accounts — checking, savings, investments, retirement, and debts. Cairn tracks balances over time and calculates your net worth automatically. Log an updated balance for any account whenever it changes.',
  },
  {
    title: 'Transactions',
    body:  'Log any income, expense, or savings entry — one at a time, past or present. Transactions are the core of everything: they power your dashboard, budget guidance, and spending breakdown. Set up categories in Settings before you start.',
  },
  {
    title: 'Bulk Import',
    body:  'Have past data in a notes app? Paste it here to load a whole month at once instead of adding entries one by one. Each line is one transaction: use + for income, − for expenses, and = for savings.',
  },
  {
    title: 'Dashboard',
    body:  'Your spending picture — category breakdown, income vs. expenses over time, budget guidance, and savings trends. Populates once you have transactions logged. Add at least a month of data to see meaningful insights.',
  },
  {
    title: 'Settings',
    body:  'Categories: create the buckets (Rent, Groceries, etc.) that transactions are tagged with — required before you start tracking. The Import tab also lets you configure auto-categorization rules so recurring descriptions get assigned the right category automatically.',
  },
]

export default function ProfileSettings() {
  const { session } = useAuth()
  const { restart }  = useTour()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [tourRestarted, setTourRestarted] = useState(false)
  const [helpExpanded, setHelpExpanded]   = useState(false)

  const user      = session?.user
  const name      = user?.user_metadata?.full_name as string | undefined
  const email     = user?.email
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const initials  = name
    ? name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : email ? email.slice(0, 2).toUpperCase() : '—'

  function setTheme(to: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', to === 'dark')
    localStorage.setItem('cairn_theme', to)
    setDark(to === 'dark')
    const userId = session?.user.id
    if (userId) supabase.from('profiles').update({ theme: to }).eq('id', userId)
  }

  function handleRestartTour() {
    restart()
    setTourRestarted(true)
    setTimeout(() => setTourRestarted(false), 2000)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="px-9 py-8">
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold text-ink tracking-[-0.02em]">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your account and preferences.</p>
      </div>

      <SettingsNav />

      <div className="max-w-[560px] space-y-8">

        {/* Account */}
        <section>
          <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow mb-3">Account</p>
          <div className="rounded-[18px] border border-border bg-surface shadow-card px-5 py-4 flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name ?? email ?? ''} className="w-11 h-11 rounded-full shrink-0 object-cover" />
            ) : (
              <div
                className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-white text-[14px] font-semibold"
                style={{ background: 'linear-gradient(135deg, var(--terra), var(--forest))' }}
              >
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-ink truncate">{name ?? '—'}</p>
              <p className="text-[12.5px] text-ink-muted truncate">{email ?? '—'}</p>
              <p className="text-[11px] text-ink-faint mt-0.5">Managed by Google</p>
            </div>
            <button
              onClick={signOut}
              className="shrink-0 px-3 py-1.5 text-xs font-medium border border-border rounded-[8px] text-ink-muted hover:text-red hover:border-red hover:bg-red-soft transition-colors"
            >
              Sign out
            </button>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow mb-3">Appearance</p>
          <div className="rounded-[18px] border border-border bg-surface shadow-card px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[13.5px] font-medium text-ink">Theme</p>
              <p className="text-[12px] text-ink-muted mt-0.5">Choose how Cairn looks to you.</p>
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-[10px] bg-surface-alt border border-border shrink-0">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium transition-all ${
                  !dark ? 'bg-surface border border-border shadow-card text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="3.5"/>
                  <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"/>
                </svg>
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium transition-all ${
                  dark ? 'bg-surface border border-border shadow-card text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7z"/>
                </svg>
                Dark
              </button>
            </div>
          </div>
        </section>

        {/* Help & Tour */}
        <section>
          <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow mb-3">Help & Tour</p>
          <div className="rounded-[18px] border border-border bg-surface shadow-card overflow-hidden">
            {/* Header row — always visible, toggles the section */}
            <button
              onClick={() => setHelpExpanded(o => !o)}
              className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-surface-alt transition-colors text-left"
            >
              <div>
                <p className="text-[13.5px] font-medium text-ink">How to use Cairn</p>
                <p className="text-[12px] text-ink-muted mt-0.5">Feature guide and tour controls.</p>
              </div>
              <svg
                width={16} height={16} viewBox="0 0 16 16" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`shrink-0 text-ink-muted transition-transform duration-200 ${helpExpanded ? 'rotate-180' : ''}`}
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>

            {/* Collapsible content */}
            {helpExpanded && (
              <>
                <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-4">
                  <p className="text-[13px] text-ink-muted">Walk through the key features again.</p>
                  <button
                    onClick={handleRestartTour}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium border border-border rounded-[8px] text-ink hover:bg-surface-alt transition-colors"
                  >
                    {tourRestarted ? '✓ Started' : '↺ Restart tour'}
                  </button>
                </div>
                <div className="divide-y divide-border border-t border-border">
                  {HELP_SECTIONS.map(s => (
                    <div key={s.title} className="px-5 py-4">
                      <p className="text-[10.5px] font-medium text-ink-faint uppercase tracking-eyebrow mb-1.5">{s.title}</p>
                      <p className="text-[13px] text-ink-muted leading-relaxed">{s.body}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
