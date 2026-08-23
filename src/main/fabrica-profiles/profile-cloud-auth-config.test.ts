import { describe, expect, it, vi } from 'vitest'
import {
  allowsPlaintextFABRICACloudSession,
  getFABRICACloudAuthConfig,
  isFABRICACloudDevAuthEnabled
} from './profile-cloud-auth-config'

vi.mock('electron', () => ({
  app: {
    isPackaged: false
  }
}))

describe('FABRICA cloud auth config', () => {
  it('reports unconfigured without both API URL and client ID', () => {
    expect(getFABRICACloudAuthConfig({})).toEqual({
      configured: false,
      setupMessage: 'Fabrica Cloud sign-in is not configured for this build.'
    })
  })

  it('builds default desktop auth endpoints from the API URL', () => {
    const state = getFABRICACloudAuthConfig({
      FABRICA_CLOUD_API_URL: 'https://FABRICA-cloud.example/',
      FABRICA_CLOUD_CLIENT_ID: 'desktop-client'
    })

    expect(state).toEqual({
      configured: true,
      config: {
        apiBaseUrl: 'https://fabrica-cloud.example',
        authorizeEndpoint: 'https://fabrica-cloud.example/v1/desktop/auth/authorize',
        sessionEndpoint: 'https://fabrica-cloud.example/v1/desktop/auth/session',
        refreshEndpoint: 'https://fabrica-cloud.example/v1/desktop/auth/refresh',
        capabilitiesEndpoint: 'https://fabrica-cloud.example/v1/desktop/auth/capabilities',
        profileEndpoint: 'https://fabrica-cloud.example/v1/desktop/auth/profile',
        orgEndpoint: 'https://fabrica-cloud.example/v1/desktop/auth/org',
        logoutEndpoint: 'https://fabrica-cloud.example/v1/desktop/auth/logout',
        relayTokenEndpoint: 'https://fabrica-cloud.example/v1/desktop/auth/relay-token',
        relayDirectorUrl: 'https://relay.onFABRICA.dev',
        clientId: 'desktop-client',
        scope: 'openid profile email offline_access'
      }
    })
  })

  it('uses first-party production endpoints without runtime env in packaged builds', () => {
    expect(getFABRICACloudAuthConfig({}, true)).toEqual({
      configured: true,
      config: {
        apiBaseUrl: 'https://login.onFABRICA.dev',
        authorizeEndpoint: 'https://login.onfabrica.dev/v1/desktop/auth/authorize',
        sessionEndpoint: 'https://login.onfabrica.dev/v1/desktop/auth/session',
        refreshEndpoint: 'https://login.onfabrica.dev/v1/desktop/auth/refresh',
        capabilitiesEndpoint: 'https://login.onfabrica.dev/v1/desktop/auth/capabilities',
        profileEndpoint: 'https://login.onfabrica.dev/v1/desktop/auth/profile',
        orgEndpoint: 'https://login.onfabrica.dev/v1/desktop/auth/org',
        logoutEndpoint: 'https://login.onfabrica.dev/v1/desktop/auth/logout',
        relayTokenEndpoint: 'https://login.onfabrica.dev/v1/desktop/auth/relay-token',
        relayDirectorUrl: 'https://relay.onFABRICA.dev',
        clientId: 'FABRICA-desktop',
        scope: 'openid profile email offline_access'
      }
    })
  })

  it('allows loopback HTTP endpoints for local desktop auth development', () => {
    const state = getFABRICACloudAuthConfig({
      FABRICA_CLOUD_API_URL: 'http://localhost:4100',
      FABRICA_CLOUD_CLIENT_ID: 'desktop-client'
    })

    expect(state.configured).toBe(true)
  })

  it('rejects loopback HTTP endpoints in packaged builds', () => {
    expect(
      getFABRICACloudAuthConfig(
        {
          FABRICA_CLOUD_API_URL: 'http://localhost:4100',
          FABRICA_CLOUD_CLIENT_ID: 'desktop-client'
        },
        true
      )
    ).toMatchObject({ configured: false })

    const httpsState = getFABRICACloudAuthConfig(
      {
        FABRICA_CLOUD_API_URL: 'https://FABRICA-cloud.example',
        FABRICA_CLOUD_CLIENT_ID: 'desktop-client'
      },
      true
    )
    expect(httpsState.configured).toBe(true)
  })

  it('rejects non-HTTPS non-loopback API URLs', () => {
    expect(
      getFABRICACloudAuthConfig({
        FABRICA_CLOUD_API_URL: 'http://FABRICA-cloud.example',
        FABRICA_CLOUD_CLIENT_ID: 'desktop-client'
      })
    ).toMatchObject({ configured: false })
  })

  it('allows dev plaintext sessions only outside production', () => {
    expect(
      allowsPlaintextFABRICACloudSession({
        FABRICA_CLOUD_ALLOW_PLAINTEXT_SESSION: '1',
        NODE_ENV: 'development'
      })
    ).toBe(true)
    expect(
      allowsPlaintextFABRICACloudSession({
        FABRICA_CLOUD_ALLOW_PLAINTEXT_SESSION: '1',
        NODE_ENV: 'production'
      })
    ).toBe(false)
  })

  it('ignores dev flags in packaged builds even without NODE_ENV', () => {
    // Why: packaged main bundles never define NODE_ENV, so packaged-ness must
    // gate the escape hatches on its own.
    expect(
      allowsPlaintextFABRICACloudSession({ FABRICA_CLOUD_ALLOW_PLAINTEXT_SESSION: '1' }, true)
    ).toBe(false)
    expect(isFABRICACloudDevAuthEnabled({ FABRICA_CLOUD_DEV_AUTH: '1' }, true)).toBe(false)
  })

  it('allows local dev auth only outside production', () => {
    expect(
      isFABRICACloudDevAuthEnabled({
        FABRICA_CLOUD_DEV_AUTH: '1',
        NODE_ENV: 'development'
      })
    ).toBe(true)
    expect(
      isFABRICACloudDevAuthEnabled({
        FABRICA_CLOUD_DEV_AUTH: '1',
        NODE_ENV: 'production'
      })
    ).toBe(false)
  })
})
