import type {
  CreateCloudLinkedFABRICAProfileArgs,
  FABRICAProfileListState
} from '../../shared/fabrica-profiles'
import type { ActiveFABRICAProfileState } from './profile-index-store'
import { createCloudLinkedFABRICAProfileRecord, linkFABRICAProfileToCloud } from './profile-cloud-index'
import { readFABRICACloudSession, saveFABRICACloudSessionExchange } from './profile-cloud-session-store'
import { createDevFABRICACloudSession } from './profile-cloud-dev-auth'

type DevProfileListResult = FABRICAProfileListState

type DevCreateProfileResult =
  | {
      status: 'created'
      list: ReturnType<typeof createCloudLinkedFABRICAProfileRecord>
    }
  | { status: 'reconnect-required' }

type DevMutationResult =
  | {
      status: 'updated'
      list: DevProfileListResult
    }
  | { status: 'reconnect-required' }

export function connectDevFABRICACloudProfile(
  active: ActiveFABRICAProfileState,
  userDataPath: string
): DevProfileListResult {
  const session = createDevFABRICACloudSession({ localProfileId: active.profile.id })
  saveFABRICACloudSessionExchange(active.profile.id, userDataPath, session)
  return linkFABRICAProfileToCloud(active.profile.id, session.cloud, userDataPath)
}

export function createDevCloudLinkedFABRICAProfile(
  active: ActiveFABRICAProfileState,
  userDataPath: string,
  args: CreateCloudLinkedFABRICAProfileArgs
): DevCreateProfileResult {
  if (readFABRICACloudSession(active.profile.id, userDataPath).status !== 'found') {
    return { status: 'reconnect-required' }
  }
  const session = createDevFABRICACloudSession({ orgId: args.orgId })
  const list = createCloudLinkedFABRICAProfileRecord(session.cloud, { name: args.name }, userDataPath)
  saveFABRICACloudSessionExchange(list.profile.id, userDataPath, session)
  return { status: 'created', list }
}

export function refreshDevFABRICACloudProfile(
  active: ActiveFABRICAProfileState,
  userDataPath: string
): DevMutationResult {
  if (
    !active.profile.cloud ||
    readFABRICACloudSession(active.profile.id, userDataPath).status !== 'found'
  ) {
    return { status: 'reconnect-required' }
  }
  const session = createDevFABRICACloudSession({
    localProfileId: active.profile.id,
    cloudProfileId: active.profile.cloud.cloudProfileId,
    orgId: active.profile.cloud.activeOrgId
  })
  saveFABRICACloudSessionExchange(active.profile.id, userDataPath, session)
  return {
    status: 'updated',
    list: linkFABRICAProfileToCloud(active.profile.id, session.cloud, userDataPath)
  }
}

export function selectDevFABRICACloudOrg(
  active: ActiveFABRICAProfileState,
  userDataPath: string,
  orgId: string
): DevMutationResult {
  if (
    !active.profile.cloud ||
    readFABRICACloudSession(active.profile.id, userDataPath).status !== 'found'
  ) {
    return { status: 'reconnect-required' }
  }
  const session = createDevFABRICACloudSession({
    localProfileId: active.profile.id,
    cloudProfileId: active.profile.cloud.cloudProfileId,
    orgId
  })
  saveFABRICACloudSessionExchange(active.profile.id, userDataPath, session)
  return {
    status: 'updated',
    list: linkFABRICAProfileToCloud(active.profile.id, session.cloud, userDataPath)
  }
}
