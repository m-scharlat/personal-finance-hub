import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ session: null, loading: true })

async function checkInvite(email: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('allowed_emails')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    return Boolean(data)
  } catch {
    return false
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const initialDone           = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      try {
        if (data.session) {
          const allowed = await checkInvite(data.session.user.email!)
          if (allowed) {
            setSession(data.session)
          } else {
            await supabase.auth.signOut()
          }
        }
      } finally {
        initialDone.current = true
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!initialDone.current) return

      if (event === 'SIGNED_IN' && session) {
        const allowed = await checkInvite(session.user.email!)
        if (allowed) {
          setSession(session)
          supabase
            .from('profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', session.user.id)
        } else {
          await supabase.auth.signOut()
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
