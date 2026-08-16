import type { FABRICAProfileAuthStatus } from '../../shared/fabrica-profiles'
import type { ActiveFABRICAProfileState } from './profile-index-store'
import { getFABRICACloudAuthConfig, isFABRICACloudDevAuthEnabled } from './profile-cloud-auth-config'
import { readFABRICACloudSession } from './profile-cloud-session-store'

export function getFABRICAProfileAuthStatusFromProfile(
  active: ActiveFABRICAProfileState,
  userDataPath: string
): FABRICAProfileAuthStatus {
  const configState = getFABRICACloudAuthConfig()
  const devAuthEnabled = isFABRICACloudDevAuthEnabled()
  const configured = configState.configured || devAuthEnabled
  const cloud = active.profile.cloud
  if (!cloud) {
    return {
      activeProfileId: active.profile.id,
      configured,
      state: configured ? 'local' : 'unconfigured',
      persistence: 'none',
      setupMessage: configured ? undefined : configState.setupMessage
    }
  }

  const session = readFABRICACloudSession(active.profile.id, userDataPath)
  if (!configured) {
    return {
      activeProfileId: active.profile.id,
      configured: false,
      state: 'unconfigured',
      persistence: session.status === 'found' ? session.persistence : 'none',
      cloud,
      credentialError: session.status === 'decrypt-failed' ? session.error : undefined,
      setupMessage: configState.setupMessage
    }
  }
  if (session.status === 'found') {
    return {
      activeProfileId: active.profile.id,
      configured,
      state: 'connected',
      persistence: session.persistence,
      cloud,
      organizations: session.session.organizations,
      capabilities: session.session.capabilities
    }
  }

  return {
    activeProfileId: active.profile.id,
    configured,
    state: 'reconnect-required',
    persistence: 'none',
    cloud,
    credentialError: session.status === 'decrypt-failed' ? session.error : undefined
  }
}
