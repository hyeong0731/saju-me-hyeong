import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

function readAuthCallbackError() {
  try {
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const authError = params.get('error') || hashParams.get('error')
    const authErrorDescription =
      params.get('error_description') || hashParams.get('error_description')

    if (!authError) return ''
    return decodeURIComponent(authErrorDescription || authError).replace(/\+/g, ' ')
  } catch {
    return ''
  }
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [signingIn, setSigningIn] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [callbackError] = useState(readAuthCallbackError)

  useEffect(() => {
    if (!supabase) return undefined

    let cancelled = false

    function applySession(session) {
      if (cancelled) return
      setUser(session?.user ?? null)
      setAuthReady(true)
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => applySession(session))
      .catch(() => applySession(null))

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) setAuthReady(true)
    }, 4000)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  async function signInWithGoogle({ switchAccount = false } = {}) {
    if (!supabase) return ''

    setSigningIn(true)

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        ...(switchAccount ? { queryParams: { prompt: 'select_account' } } : {}),
      },
    })

    if (signInError) {
      setSigningIn(false)
      return signInError.message
    }

    return ''
  }

  async function signOut() {
    if (!supabase) return ''

    setSigningOut(true)

    const { error: signOutError } = await supabase.auth.signOut()
    setSigningOut(false)

    return signOutError?.message ?? ''
  }

  return {
    user,
    authReady,
    signingIn,
    signingOut,
    callbackError,
    signInWithGoogle,
    signOut,
  }
}
