import type {
  FABRICAProfileOrgInviteRevokeArgs,
  FABRICAProfileOrgMemberChangeRoleArgs,
  FABRICAProfileOrgMemberInviteArgs,
  FABRICAProfileOrgMemberMutationResult,
  FABRICAProfileOrgMemberRemoveArgs,
  FABRICAProfileOrgMembersListResult
} from '../../shared/fabrica-profiles'
import type { ActiveFABRICAProfileState } from './profile-index-store'
import { ensureActiveFABRICAProfile } from './profile-index-store'
import type { FABRICACloudAuthConfig } from './profile-cloud-auth-config'
import { getFABRICACloudAuthConfig, isFABRICACloudDevAuthEnabled } from './profile-cloud-auth-config'
import type { FABRICACloudSession } from './profile-cloud-session-store'
import { FABRICACloudRequestError } from './profile-cloud-client'
import { runWithFreshFABRICACloudSession } from './profile-cloud-session-refresh'
import {
  changeFABRICACloudOrgMemberRole,
  inviteFABRICACloudOrgMember,
  listFABRICACloudOrgMembers,
  removeFABRICACloudOrgMember,
  revokeFABRICACloudOrgInvite
} from './profile-cloud-org-members-client'
import {
  changeDevFABRICACloudOrgMemberRole,
  inviteDevFABRICACloudOrgMember,
  listDevFABRICACloudOrgMembers,
  removeDevFABRICACloudOrgMember,
  revokeDevFABRICACloudOrgInvite
} from './profile-cloud-dev-org-members'

type OrgCallResult<T> =
  | { status: 'ok'; value: T }
  | { status: 'reconnect-required' }
  | { status: 'request-error'; error: FABRICACloudRequestError }
  | { status: 'failed'; error: string }

// Why: only a 401 means the token itself is stale and should drive a session
// refresh/reconnect. 403/404/409/400 are business or permission outcomes the UI
// must interpret, so they are surfaced as values rather than thrown — otherwise
// runWithFreshFABRICACloudSession would treat a 403 as an auth failure and burn a
// pointless token refresh + retry before giving up.
async function runOrgMemberCall<T>(
  config: FABRICACloudAuthConfig,
  active: ActiveFABRICAProfileState,
  userDataPath: string,
  call: (session: FABRICACloudSession) => Promise<T>
): Promise<OrgCallResult<T>> {
  try {
    const operation = await runWithFreshFABRICACloudSession(
      config,
      active,
      userDataPath,
      async (session) => {
        try {
          return { ok: true as const, value: await call(session) }
        } catch (error) {
          if (error instanceof FABRICACloudRequestError && error.statusCode !== 401) {
            return { ok: false as const, error }
          }
          throw error
        }
      }
    )
    if (operation.status !== 'ok') {
      return { status: 'reconnect-required' }
    }
    const outcome = operation.value
    return outcome.ok
      ? { status: 'ok', value: outcome.value }
      : { status: 'request-error', error: outcome.error }
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message : String(error) }
  }
}

function mapMutationRequestError(error: FABRICACloudRequestError): FABRICAProfileOrgMemberMutationResult {
  switch (error.statusCode) {
    case 403:
      return { status: 'forbidden' }
    case 404:
      return { status: 'not-found' }
    case 409:
      return {
        status: 'conflict',
        reason: error.errorCode === 'already_member' ? 'already_member' : 'already_invited'
      }
    case 400:
      return {
        status: 'invalid',
        reason:
          error.errorCode === 'cannot_remove_self' ? 'cannot_remove_self' : 'cannot_change_own_role'
      }
    default:
      return { status: 'failed', error: error.message }
  }
}

function mapMutationResult(result: OrgCallResult<void>): FABRICAProfileOrgMemberMutationResult {
  switch (result.status) {
    case 'ok':
      return { status: 'ok' }
    case 'reconnect-required':
      return { status: 'reconnect-required' }
    case 'request-error':
      return mapMutationRequestError(result.error)
    case 'failed':
      return { status: 'failed', error: result.error }
  }
}

export async function listFABRICAProfileOrgMembers(
  userDataPath: string,
  orgId: string
): Promise<FABRICAProfileOrgMembersListResult> {
  const active = ensureActiveFABRICAProfile(userDataPath)
  if (isFABRICACloudDevAuthEnabled()) {
    return { status: 'ok', roster: listDevFABRICACloudOrgMembers(orgId) }
  }
  const configState = getFABRICACloudAuthConfig()
  if (!configState.configured) {
    return { status: 'unconfigured' }
  }
  const result = await runOrgMemberCall(configState.config, active, userDataPath, (session) =>
    listFABRICACloudOrgMembers(configState.config, session, orgId)
  )
  switch (result.status) {
    case 'ok':
      return { status: 'ok', roster: result.value }
    case 'reconnect-required':
      return { status: 'reconnect-required' }
    case 'request-error':
      return { status: 'failed', error: result.error.message }
    case 'failed':
      return { status: 'failed', error: result.error }
  }
}

export async function inviteFABRICAProfileOrgMember(
  userDataPath: string,
  args: FABRICAProfileOrgMemberInviteArgs
): Promise<FABRICAProfileOrgMemberMutationResult> {
  const active = ensureActiveFABRICAProfile(userDataPath)
  if (isFABRICACloudDevAuthEnabled()) {
    return inviteDevFABRICACloudOrgMember(args)
  }
  const configState = getFABRICACloudAuthConfig()
  if (!configState.configured) {
    return { status: 'unconfigured' }
  }
  return mapMutationResult(
    await runOrgMemberCall(configState.config, active, userDataPath, (session) =>
      inviteFABRICACloudOrgMember(configState.config, session, args)
    )
  )
}

export async function revokeFABRICAProfileOrgInvite(
  userDataPath: string,
  args: FABRICAProfileOrgInviteRevokeArgs
): Promise<FABRICAProfileOrgMemberMutationResult> {
  const active = ensureActiveFABRICAProfile(userDataPath)
  if (isFABRICACloudDevAuthEnabled()) {
    return revokeDevFABRICACloudOrgInvite(args)
  }
  const configState = getFABRICACloudAuthConfig()
  if (!configState.configured) {
    return { status: 'unconfigured' }
  }
  return mapMutationResult(
    await runOrgMemberCall(configState.config, active, userDataPath, (session) =>
      revokeFABRICACloudOrgInvite(configState.config, session, args)
    )
  )
}

export async function changeFABRICAProfileOrgMemberRole(
  userDataPath: string,
  args: FABRICAProfileOrgMemberChangeRoleArgs
): Promise<FABRICAProfileOrgMemberMutationResult> {
  const active = ensureActiveFABRICAProfile(userDataPath)
  if (isFABRICACloudDevAuthEnabled()) {
    return changeDevFABRICACloudOrgMemberRole(args)
  }
  const configState = getFABRICACloudAuthConfig()
  if (!configState.configured) {
    return { status: 'unconfigured' }
  }
  return mapMutationResult(
    await runOrgMemberCall(configState.config, active, userDataPath, (session) =>
      changeFABRICACloudOrgMemberRole(configState.config, session, args)
    )
  )
}

export async function removeFABRICAProfileOrgMember(
  userDataPath: string,
  args: FABRICAProfileOrgMemberRemoveArgs
): Promise<FABRICAProfileOrgMemberMutationResult> {
  const active = ensureActiveFABRICAProfile(userDataPath)
  if (isFABRICACloudDevAuthEnabled()) {
    return removeDevFABRICACloudOrgMember(args)
  }
  const configState = getFABRICACloudAuthConfig()
  if (!configState.configured) {
    return { status: 'unconfigured' }
  }
  return mapMutationResult(
    await runOrgMemberCall(configState.config, active, userDataPath, (session) =>
      removeFABRICACloudOrgMember(configState.config, session, args)
    )
  )
}
