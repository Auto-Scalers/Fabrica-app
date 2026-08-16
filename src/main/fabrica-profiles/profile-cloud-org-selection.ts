import type { FABRICACloudAuthConfig } from './profile-cloud-auth-config'
import {
  FABRICACloudRequestError,
  refreshFABRICACloudSession,
  selectFABRICACloudOrg
} from './profile-cloud-client'
import { linkFABRICAProfileToCloud } from './profile-cloud-index'
import type { ActiveFABRICAProfileState } from './profile-index-store'
import {
  cloudSessionIdentity,
  recordCloudSessionIdentityMutation,
  recordCloudSessionIdentityMutationIfCurrent
} from './profile-cloud-session-mutation'
import {
  readFABRICACloudSession,
  saveFABRICACloudSessionIfCurrent,
  type FABRICACloudSession
} from './profile-cloud-session-store'

export async function selectCloudOrgWithMutationFence(input: {
  config: FABRICACloudAuthConfig
  active: ActiveFABRICAProfileState
  userDataPath: string
  orgId: string
}): Promise<ReturnType<typeof linkFABRICAProfileToCloud> | null> {
  const cloud = input.active.profile.cloud
  const stored = readFABRICACloudSession(input.active.profile.id, input.userDataPath)
  if (!cloud || stored.status !== 'found') {
    return null
  }
  const oldIdentity = cloudSessionIdentity(input.active.profile.id, cloud)
  const targetIdentity = {
    ...oldIdentity,
    organizationId: input.orgId
  }
  // Why: advance the durable identity fence before the first request. An old
  // refresh may finish, but its compare-and-save can no longer publish.
  const snapshot = recordCloudSessionIdentityMutation(targetIdentity, input.userDataPath)
  let workingSession: FABRICACloudSession = stored.session
  try {
    let selected
    try {
      selected = await selectFABRICACloudOrg(input.config, workingSession, input.orgId)
    } catch (error) {
      if (!(error instanceof FABRICACloudRequestError) || error.statusCode !== 401) {
        throw error
      }
      const refreshed = await refreshFABRICACloudSession(input.config, workingSession)
      if (
        refreshed.cloud.userId !== cloud.userId ||
        refreshed.cloud.cloudProfileId !== cloud.cloudProfileId
      ) {
        throw new Error('FABRICA_cloud_identity_changed_during_org_selection')
      }
      workingSession = {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
        organizations: refreshed.organizations,
        capabilities: refreshed.capabilities
      }
      selected = await selectFABRICACloudOrg(input.config, workingSession, input.orgId)
    }
    if (
      selected.cloud.userId !== cloud.userId ||
      selected.cloud.cloudProfileId !== cloud.cloudProfileId ||
      selected.cloud.activeOrgId !== input.orgId
    ) {
      throw new Error('FABRICA_cloud_org_selection_identity_mismatch')
    }
    const nextSession: FABRICACloudSession = {
      ...workingSession,
      organizations: selected.organizations ?? workingSession.organizations,
      capabilities: selected.capabilities
    }
    if (
      saveFABRICACloudSessionIfCurrent(
        input.active.profile.id,
        input.userDataPath,
        nextSession,
        snapshot
      ) === null
    ) {
      throw new Error('stale_cloud_session_mutation')
    }
    const list = linkFABRICAProfileToCloud(input.active.profile.id, selected.cloud, input.userDataPath)
    return list
  } catch (error) {
    recordCloudSessionIdentityMutationIfCurrent(oldIdentity, input.userDataPath, snapshot)
    throw error
  }
}
