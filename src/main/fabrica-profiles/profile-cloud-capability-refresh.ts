import type { RefreshCurrentFABRICAProfileAuthResult } from '../../shared/fabrica-profiles'
import { getFABRICACloudAuthConfig, isFABRICACloudDevAuthEnabled } from './profile-cloud-auth-config'
import { getFABRICAProfileAuthStatusFromProfile } from './profile-cloud-auth-status'
import { refreshFABRICACloudCapabilities } from './profile-cloud-client'
import { linkFABRICAProfileToCloud } from './profile-cloud-index'
import { ensureActiveFABRICAProfile, getFABRICAProfileListState } from './profile-index-store'
import { refreshDevFABRICACloudProfile } from './profile-cloud-dev-service'
import {
  captureCloudSessionMutation,
  cloudSessionIdentity,
  recordCloudSessionIdentityMutationIfCurrent
} from './profile-cloud-session-mutation'
import { runWithFreshFABRICACloudSession } from './profile-cloud-session-refresh'
import { readFABRICACloudSession, saveFABRICACloudSessionIfCurrent } from './profile-cloud-session-store'

export async function refreshCurrentFABRICAProfileAuth(
  userDataPath: string
): Promise<RefreshCurrentFABRICAProfileAuthResult> {
  const active = ensureActiveFABRICAProfile(userDataPath)
  const auth = () => getFABRICAProfileAuthStatusFromProfile(active, userDataPath)
  if (!active.profile.cloud) {
    return { status: 'local', auth: auth() }
  }
  if (isFABRICACloudDevAuthEnabled()) {
    const result = refreshDevFABRICACloudProfile(active, userDataPath)
    if (result.status !== 'updated') {
      return { status: 'reconnect-required', auth: auth() }
    }
    return {
      status: 'refreshed',
      auth: auth(),
      activeProfileId: result.list.activeProfileId,
      profiles: result.list.profiles
    }
  }
  const configState = getFABRICACloudAuthConfig()
  if (!configState.configured) {
    return { status: 'unconfigured', auth: auth() }
  }
  try {
    const identity = cloudSessionIdentity(active.profile.id, active.profile.cloud)
    let mutationSnapshot = captureCloudSessionMutation(identity, userDataPath)
    const operation = await runWithFreshFABRICACloudSession(
      configState.config,
      active,
      userDataPath,
      (session) => refreshFABRICACloudCapabilities(configState.config, session)
    )
    if (operation.status !== 'ok') {
      return { status: 'reconnect-required', auth: auth() }
    }
    const refresh = operation.value
    if (refresh.cloud) {
      const refreshedIdentity = cloudSessionIdentity(active.profile.id, refresh.cloud)
      if (
        refreshedIdentity.cloudUserId !== identity.cloudUserId ||
        refreshedIdentity.cloudProfileId !== identity.cloudProfileId
      ) {
        throw new Error('FABRICA_cloud_identity_changed_during_capability_refresh')
      }
      if (refreshedIdentity.organizationId !== identity.organizationId) {
        const advanced = recordCloudSessionIdentityMutationIfCurrent(
          refreshedIdentity,
          userDataPath,
          mutationSnapshot
        )
        if (!advanced) {
          return { status: 'reconnect-required', auth: auth() }
        }
        mutationSnapshot = advanced
      }
    }
    const session = readFABRICACloudSession(active.profile.id, userDataPath)
    if (session.status !== 'found') {
      return { status: 'reconnect-required', auth: auth() }
    }
    if (
      saveFABRICACloudSessionIfCurrent(
        active.profile.id,
        userDataPath,
        {
          ...session.session,
          organizations: refresh.organizations ?? session.session.organizations,
          capabilities: refresh.capabilities
        },
        mutationSnapshot
      ) === null
    ) {
      return { status: 'reconnect-required', auth: auth() }
    }
    const list = refresh.cloud
      ? linkFABRICAProfileToCloud(active.profile.id, refresh.cloud, userDataPath)
      : getFABRICAProfileListState(userDataPath)
    return {
      status: 'refreshed',
      auth: getFABRICAProfileAuthStatusFromProfile(
        ensureActiveFABRICAProfile(userDataPath),
        userDataPath
      ),
      activeProfileId: list.activeProfileId,
      profiles: list.profiles
    }
  } catch (error) {
    return {
      status: 'failed',
      auth: auth(),
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
