import { useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import { translate } from '@/i18n/i18n'
import logo from '../../../../resources/logo.svg'
import heroBg from '../../../../resources/fabrica-hero-bg.jpg'

export function StartupGate(): React.JSX.Element | null {
  const authStatus = useAppStore((state) => state.FABRICAProfileAuthStatus)
  const fetchAuthStatus = useAppStore((state) => state.fetchFABRICAProfileAuthStatus)
  const connect = useAppStore((state) => state.connectCurrentFABRICAProfile)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (!authStatus) {
      void fetchAuthStatus()
    }
  }, [authStatus, fetchAuthStatus])

  if (!authStatus) {
    return null
  }

  if (authStatus.state === 'connected') {
    return null
  }

  const canConnect = authStatus.configured === true

  const handleLogin = async (): Promise<void> => {
    if (connecting || !canConnect) {
      return
    }
    setConnecting(true)
    try {
      await connect()
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover blur-sm" />
      <div className="absolute inset-0 bg-background/80" />
      <div className="relative z-10 flex flex-col items-center gap-6 p-8">
        <img src={logo} alt="Fabrica" className="h-16 w-16" />
        <h1 className="text-2xl font-semibold text-foreground">
          {translate('auto.components.StartupGate.title', 'Welcome to Fabrica')}
        </h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {translate(
            'auto.components.StartupGate.description',
            'Sign in to your Fabrica account to access cloud features, artifacts, and relay.'
          )}
        </p>
        <button
          type="button"
          onClick={() => void handleLogin()}
          disabled={connecting || !canConnect}
          className="px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {connecting
            ? translate('auto.components.StartupGate.signingIn', 'Signing in…')
            : translate('auto.components.StartupGate.signIn', 'Sign in to Fabrica')}
        </button>
        {!canConnect && (
          <p className="text-xs text-destructive">
            {translate(
              'auto.components.StartupGate.notConfigured',
              'Fabrica sign-in is not configured in this build.'
            )}
          </p>
        )}
        {authStatus.state === 'reconnect-required' && (
          <p className="text-xs text-destructive">
            {translate(
              'auto.components.StartupGate.reconnectRequired',
              'Your session expired. Please sign in again.'
            )}
          </p>
        )}
      </div>
    </div>
  )
}
