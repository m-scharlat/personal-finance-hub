import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  last_login_at: string
}

interface Invite {
  id: string
  email: string
  note: string | null
  invited_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function Admin() {
  const { session } = useAuth()
  const isAdmin = session?.user.email === ADMIN_EMAIL

  const [profiles, setProfiles]   = useState<Profile[]>([])
  const [invites, setInvites]     = useState<Invite[]>([])
  const [newEmail, setNewEmail]   = useState('')
  const [newNote, setNewNote]     = useState('')
  const [adding, setAdding]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin])

  async function load() {
    const [{ data: profileData }, { data: inviteData }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('allowed_emails').select('*').order('invited_at', { ascending: false }),
    ])
    setProfiles(profileData ?? [])
    setInvites(inviteData ?? [])
  }

  async function addInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setAdding(true)
    setError(null)
    const { error } = await supabase
      .from('allowed_emails')
      .insert({ email: newEmail.trim().toLowerCase(), note: newNote.trim() || null })
    if (error) {
      setError(error.message.includes('unique') ? 'That email is already invited.' : error.message)
    } else {
      setNewEmail('')
      setNewNote('')
      await load()
    }
    setAdding(false)
  }

  async function removeInvite(id: string) {
    await supabase.from('allowed_emails').delete().eq('id', id)
    await load()
  }

  if (!isAdmin) return <Navigate to="/" replace />

  const activeUsers = profiles.filter(p => {
    const days = (Date.now() - new Date(p.last_login_at).getTime()) / 86400000
    return days <= 30
  }).length

  return (
    <div className="px-9 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[26px] font-semibold text-ink tracking-[-0.02em]">Admin</h1>
        <p className="text-sm text-ink-muted mt-1">Usage overview and invite management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Users',    value: profiles.length },
          { label: 'Active (30d)',   value: activeUsers },
          { label: 'Invited',        value: invites.length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-[18px] border border-border bg-surface shadow-card px-6 py-5">
            <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow mb-1">{label}</p>
            <p className="text-[28px] font-semibold text-ink num">{value}</p>
          </div>
        ))}
      </div>

      {/* Users */}
      <div className="rounded-[18px] border border-border bg-surface shadow-card mb-6">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow">Users</p>
        </div>
        <div className="divide-y divide-border">
          {profiles.length === 0 ? (
            <p className="px-6 py-5 text-sm text-ink-faint">No users yet.</p>
          ) : profiles.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-6 py-4">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-semibold"
                  style={{ background: 'linear-gradient(135deg, var(--terra), var(--forest))' }}>
                  {(p.full_name ?? p.email).slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-ink truncate">{p.full_name ?? '—'}</p>
                <p className="text-[11.5px] text-ink-faint truncate">{p.email}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[12px] text-ink-muted">Joined {formatDate(p.created_at)}</p>
                <p className="text-[11.5px] text-ink-faint">Last login {timeAgo(p.last_login_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invites */}
      <div className="rounded-[18px] border border-border bg-surface shadow-card">
        <div className="px-6 py-4 border-b border-border">
          <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow">Invite List</p>
        </div>

        {/* Add invite form */}
        <form onSubmit={addInvite} className="px-6 py-4 border-b border-border flex items-end gap-3">
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] text-ink-faint mb-1">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full text-[13.5px] px-3 py-2 rounded-[8px] border border-border bg-bg text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-terra"
            />
          </div>
          <div className="w-40">
            <label className="block text-[11px] text-ink-faint mb-1">Note (optional)</label>
            <input
              type="text"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="e.g. Sister"
              className="w-full text-[13.5px] px-3 py-2 rounded-[8px] border border-border bg-bg text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-terra"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !newEmail.trim()}
            className="shrink-0 px-4 py-2 rounded-[8px] bg-terra text-white text-[13.5px] font-medium shadow-terra hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer disabled:cursor-default"
          >
            {adding ? 'Adding…' : 'Add invite'}
          </button>
        </form>
        {error && <p className="px-6 pb-3 text-sm text-red">{error}</p>}

        {/* Invite rows */}
        <div className="divide-y divide-border">
          {invites.length === 0 ? (
            <p className="px-6 py-5 text-sm text-ink-faint">No invites yet.</p>
          ) : invites.map(inv => (
            <div key={inv.id} className="flex items-center gap-3 px-6 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] text-ink truncate">{inv.email}</p>
                {inv.note && <p className="text-[11.5px] text-ink-faint">{inv.note}</p>}
              </div>
              <p className="text-[12px] text-ink-faint shrink-0">{formatDate(inv.invited_at)}</p>
              <button
                onClick={() => removeInvite(inv.id)}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-ink-faint hover:text-red hover:bg-red-soft transition-colors"
                aria-label="Remove invite"
              >
                <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3l10 10M13 3L3 13" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
