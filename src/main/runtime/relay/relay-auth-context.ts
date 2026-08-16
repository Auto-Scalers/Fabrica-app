import type { FABRICACloudAuthConfig } from '../../fabrica-profiles/profile-cloud-auth-config'
import { ensureActiveFABRICAProfile } from '../../fabrica-profiles/profile-index-store'
import { readFreshFABRICACloudSession } from '../../fabrica-profiles/profile-cloud-session-refresh'
import type { RelayAuthContext } from './relay-auth-coordinator'

export async function readRelayAuthContext(
  authConfig: FABRICACloudAuthConfig,
  userDataPath: string
): Promise<RelayAuthContext | null> {
  const active = ensureActiveFABRICAProfile(userDataPath)
  if (!active.profile.cloud) {
    return null
  }
  const session = await readFreshFABRICACloudSession(authConfig, active, userDataPath)
  if (session.status !== 'found') {
    return null
  }
  // Why: refresh and org-selection can rewrite cloud linkage while the request
  // is in flight; identity must come from the post-refresh profile state.
  const refreshed = ensureActiveFABRICAProfile(userDataPath)
  const cloud = refreshed.profile.cloud
  if (!cloud || refreshed.profile.id !== active.profile.id) {
    return null
  }
  return {
    identity: {
      userId: cloud.userId,
      profileId: cloud.cloudProfileId,
      organizationId: cloud.activeOrgId ?? ''
    },
    accessToken: session.session.accessToken,
    relayEntitled: session.session.capabilities.flags['relay.use'] === true
  }
}
