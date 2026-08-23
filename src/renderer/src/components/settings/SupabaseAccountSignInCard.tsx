import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SupabaseAccountSignInCard(): React.JSX.Element | null {
  const [status, setStatus] = useState<{
    configured: boolean
    signedIn: boolean
    email?: string
  } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void window.api.supabaseAuth.getStatus().then((next) => {
      if (!cancelled) {
        setStatus(next)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!status?.configured) {
    return null
  }

  const signIn = async (): Promise<void> => {
    if (busy) {
      return
    }
    setBusy(true)
    setError(null)
    const result = await window.api.supabaseAuth.signIn({ email, password })
    setBusy(false)
    if (result.ok) {
      setPassword('')
      setStatus(await window.api.supabaseAuth.getStatus())
    } else {
      setError(result.error ?? 'Sign-in failed.')
    }
  }

  const signOut = async (): Promise<void> => {
    if (busy) {
      return
    }
    setBusy(true)
    await window.api.supabaseAuth.signOut()
    setBusy(false)
    setStatus(await window.api.supabaseAuth.getStatus())
  }

  if (status.signedIn) {
    return (
      <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-5">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium">Relay account</p>
          <p className="truncate text-xs text-muted-foreground">
            Signed in as {status.email ?? 'unknown user'}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void signOut()}
        >
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 border-t border-border/60 pt-5">
      <div className="space-y-1">
        <p className="text-sm font-medium">Relay account</p>
        <p className="text-xs leading-5 text-muted-foreground">
          Sign in with email and password to authenticate Fabrica Relay.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="supabase-auth-email">Email</Label>
          <Input
            id="supabase-auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="supabase-auth-password">Password</Label>
          <Input
            id="supabase-auth-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void signIn()
              }
            }}
          />
        </div>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button
        type="button"
        size="sm"
        disabled={busy || !email.trim() || !password}
        onClick={() => void signIn()}
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </Button>
    </div>
  )
}
