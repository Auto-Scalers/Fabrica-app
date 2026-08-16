import type {
  ConnectCurrentFABRICAProfileResult,
  CreateCloudLinkedFABRICAProfileArgs,
  CreateCloudLinkedFABRICAProfileResult,
  FABRICAProfileAuthStatus,
  SelectFABRICAProfileOrgResult,
  SignOutCurrentFABRICAProfileResult
} from '../../shared/fabrica-profiles'
import { ensureActiveFABRICAProfile } from './profile-index-store'
import { getFABRICACloudAuthConfig, isFABRICACloudDevAuthEnabled } from './profile-cloud-auth-config'
import {
  clearFABRICACloudSession,
  readFABRICACloudSession,
  saveFABRICACloudSessionExchange
} from './profile-cloud-session-store'
import { cloudSessionIdentity, tombstoneCloudSession } from './profile-cloud-session-mutation'
import {
  createFABRICACloudProfile,
  exchangeFABRICACloudAuthCode,
  revokeFABRICACloudSession
} from './profile-cloud-client'
import { beginFABRICACloudPkceFlow } from './profile-cloud-pkce'
import {
  createCloudLinkedFABRICAProfileRecord,
  linkFABRICAProfileToCloud,
  unlinkFABRICAProfileFromCloud
} from './profile-cloud-index'
import { runWithFreshFABRICACloudSession } from './profile-cloud-session-refresh'
import {
  connectDevFABRICACloudProfile,
  createDevCloudLinkedFABRICAProfile,
  selectDevFABRICACloudOrg
} from './profile-cloud-dev-service'
import { getFABRICAProfileAuthStatusFromProfile } from './profile-cloud-auth-status'
import { selectCloudOrgWithMutationFence } from './profile-cloud-org-selection'

export { refreshCurrentFABRICAProfileAuth } from './profile-cloud-capability-refresh'

function isUserCancelledAuthError(message: string): boolean {
  return message === 'FABRICA_cloud_auth_timeout' || message === 'FABRICA_cloud_auth_denied'
}

function activeAuth(
  active: ReturnType<typeof ensureActiveFABRICAProfile>,
  userDataPath: string
): FABRICAProfileAuthStatus {
  return getFABRICAProfileAuthStatusFromProfile(active, userDataPath)
}

export function getCurrentFABRICAProfileAuthStatus(userDataPath: string): FABRICAProfileAuthStatus {
  return getFABRICAProfileAuthStatusFromProfile(ensureActiveFABRICAProfile(userDataPath), userDataPath)
}

export async function connectCurrentFABRICAProfile(
  userDataPath: string
): Promise<ConnectCurrentFABRICAProfileResult> {
  const active = ensureActiveFABRICAProfile(userDataPath)
  if (isFABRICACloudDevAuthEnabled()) {
    const list = connectDevFABRICACloudProfile(active, userDataPath)
    return {
      status: 'connected',
      auth: getCurrentFABRICAProfileAuthStatus(userDataPath),
      activeProfileId: list.activeProfileId,
      profiles: list.profiles
    }
  }

  const configState = getFABRICACloudAuthConfig()
  if (!configState.configured) {
    return {
      status: 'unconfigured',
      auth: activeAuth(active, userDataPath)
    }
  }

  try {
    const code = await beginFABRICACloudPkceFlow(configState.config, active.profile.id)
    const exchange = await exchangeFABRICACloudAuthCode(configState.config, {
      ...code,
      localProfileId: active.profile.id
    })
    saveFABRICACloudSessionExchange(active.profile.id, userDataPath, exchange)
    const list = linkFABRICAProfileToCloud(active.profile.id, exchange.cloud, userDataPath)
    return {
      status: 'connected',
      auth: getCurrentFABRICAProfileAuthStatus(userDataPath),
      activeProfileId: list.activeProfileId,
      profiles: list.profiles
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (isUserCancelledAuthError(message)) {
      return {
        status: 'cancelled',
        auth: getCurrentFABRICAProfileAuthStatus(userDataPath)
      }
    }
    return {
      status: 'failed',
      auth: getCurrentFABRICAProfileAuthStatus(userDataPath),
      error: message
    }
  }
}

export async function signOutCurrentFABRICAProfile(
  userDataPath: string
): Promise<SignOutCurrentFABRICAProfileResult> {
  const active = ensureActiveFABRICAProfile(userDataPath)
  const configState = getFABRICACloudAuthConfig()
  const session = readFABRICACloudSession(active.profile.id, userDataPath)
  if (active.profile.cloud) {
    // Why: persist the destructive fence before logout network I/O so a
    // refresh already in flight cannot save after explicit sign-out.
    tombstoneCloudSession(
      cloudSessionIdentity(active.profile.id, active.profile.cloud),
      userDataPath
    )
  }
  if (!isFABRICACloudDevAuthEnabled() && configState.configured && session.status === 'found') {
    await revokeFABRICACloudSession(configState.config, session.session).catch(() => undefined)
  }
  clearFABRICACloudSession(active.profile.id, userDataPath)
  const list = unlinkFABRICAProfileFromCloud(active.profile.id, userDataPath)
  return {
    status: 'signed-out',
    auth: getCurrentFABRICAProfileAuthStatus(userDataPath),
    activeProfileId: list.activeProfileId,
    profiles: list.profiles
  }
}

export async function createCloudLinkedFABRICAProfile(
  userDataPath: string,
  args: CreateCloudLinkedFABRICAProfileArgs
): Promise<CreateCloudLinkedFABRICAProfileResult> {
  const active = ensureActiveFABRICAProfile(userDataPath)
  if (isFABRICACloudDevAuthEnabled()) {
    const result = createDevCloudLinkedFABRICAProfile(active, userDataPath, args)
    if (result.status !== 'created') {
      return { status: 'reconnect-required', auth: activeAuth(active, userDataPath) }
    }
    return {
      status: 'created',
      auth: getCurrentFABRICAProfileAuthStatus(userDataPath),
      activeProfileId: result.list.activeProfileId,
      profiles: result.list.profiles,
      profile: result.list.profile
    }
  }

  const configState = getFABRICACloudAuthConfig()
  if (!configState.configured) {
    return { status: 'unconfigured', auth: activeAuth(active, userDataPath) }
  }
  try {
    const operation = await runWithFreshFABRICACloudSession(
      configState.config,
      active,
      userDataPath,
      (session) => createFABRICACloudProfile(configState.config, session, args)
    )
    if (operation.status !== 'ok') {
      return { status: 'reconnect-required', auth: activeAuth(active, userDataPath) }
    }
    const created = operation.value
    const list = createCloudLinkedFABRICAProfileRecord(
      created.cloud,
      { name: args.name },
      userDataPath
    )
    saveFABRICACloudSessionExchange(list.profile.id, userDataPath, created)
    return {
      status: 'created',
      auth: getCurrentFABRICAProfileAuthStatus(userDataPath),
      activeProfileId: list.activeProfileId,
      profiles: list.profiles,
      profile: list.profile
    }
  } catch (error) {
    return {
      status: 'failed',
      auth: getCurrentFABRICAProfileAuthStatus(userDataPath),
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export async function selectCurrentFABRICAProfileOrg(
  userDataPath: string,
  orgId: string
): Promise<SelectFABRICAProfileOrgResult> {
  const active = ensureActiveFABRICAProfile(userDataPath)
  if (isFABRICACloudDevAuthEnabled()) {
    const result = selectDevFABRICACloudOrg(active, userDataPath, orgId)
    if (result.status !== 'updated') {
      return { status: 'reconnect-required', auth: activeAuth(active, userDataPath) }
    }
    return {
      status: 'selected',
      auth: getCurrentFABRICAProfileAuthStatus(userDataPath),
      activeProfileId: result.list.activeProfileId,
      profiles: result.list.profiles
    }
  }

  const configState = getFABRICACloudAuthConfig()
  if (!configState.configured) {
    return { status: 'unconfigured', auth: activeAuth(active, userDataPath) }
  }
  try {
    const list = await selectCloudOrgWithMutationFence({
      config: configState.config,
      active,
      userDataPath,
      orgId
    })
    if (!list) {
      return { status: 'reconnect-required', auth: activeAuth(active, userDataPath) }
    }
    return {
      status: 'selected',
      auth: getCurrentFABRICAProfileAuthStatus(userDataPath),
      activeProfileId: list.activeProfileId,
      profiles: list.profiles
    }
  } catch (error) {
    return {
      status: 'failed',
      auth: getCurrentFABRICAProfileAuthStatus(userDataPath),
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
