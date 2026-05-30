import { useState } from 'react'
import { supabase } from '../lib/supabase'

function CairnMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="12" y="36" width="40" height="14" rx="7" fill="var(--terra)" />
      <rect x="18" y="20" width="28" height="14" rx="7" fill="var(--forest)" />
      <rect x="24" y="4"  width="16" height="14" rx="7" fill="var(--amber)" />
    </svg>
  )
}

export default function Login() {
  const [loading, setLoading] = useState(false)

  async function signInWithGoogle() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
          >
            <CairnMark size={32} />
          </div>
          <h1 className="text-[26px] font-semibold text-ink tracking-[-0.02em]">Cairn</h1>
          <p className="text-sm text-ink-muted mt-0.5">Personal Finance Hub</p>
        </div>

        {/* Card */}
        <div className="rounded-[18px] border border-border bg-surface shadow-card px-8 py-8">
          <h2 className="text-[17px] font-semibold text-ink mb-1">Welcome</h2>
          <p className="text-sm text-ink-muted mb-6">Sign in to your personal finance hub</p>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-[11px] rounded-[10px] border border-border bg-surface hover:bg-surface-alt transition-colors text-[14px] font-medium text-ink disabled:opacity-60 cursor-pointer disabled:cursor-default"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.116 17.64 11.808 17.64 9.2z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </button>
        </div>

        <p className="text-center text-xs text-ink-faint mt-6">
          Cairn is currently invite-only. Reach out to the admin to request access.
        </p>

      </div>
    </div>
  )
}
