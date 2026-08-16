import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTestStore } from './store-test-helpers'
import type {
  CreateLocalFABRICAProfileResult,
  FABRICAProfileAuthStatus,
  FABRICAProfileListResult,
  TransferFABRICAProfileProjectResult
} from '../../../../shared/fabrica-profiles'

const { toastErrorMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn()
}))

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn()
  }
}))

const listState: FABRICAProfileListResult = {
  activeProfileId: 'local-default',
  multiProfileUi: false,
  profiles: [
    {
      id: 'local-default',
      name: 'Personal',
      avatar: { kind: 'initials', initials: 'P', color: 'neutral' },
      kind: 'local',
      createdAt: 1,
      updatedAt: 1,
      lastOpenedAt: 1
    }
  ]
}

const createdState: CreateLocalFABRICAProfileResult = {
  activeProfileId: 'local-default',
  profiles: [
    ...listState.profiles,
    {
      id: 'local-work',
      name: 'Work',
      avatar: { kind: 'initials', initials: 'W', color: 'neutral' },
      kind: 'local',
      createdAt: 2,
      updatedAt: 2,
      lastOpenedAt: 2
    }
  ],
  profile: {
    id: 'local-work',
    name: 'Work',
    avatar: { kind: 'initials', initials: 'W', color: 'neutral' },
    kind: 'local',
    createdAt: 2,
    updatedAt: 2,
    lastOpenedAt: 2
  }
}

const localAuthStatus: FABRICAProfileAuthStatus = {
  activeProfileId: 'local-default',
  configured: false,
  state: 'unconfigured',
  persistence: 'none'
}

const connectedAuthStatus: FABRICAProfileAuthStatus = {
  activeProfileId: 'local-default',
  configured: true,
  state: 'connected',
  persistence: 'encrypted',
  cloud: {
    cloudProfileId: 'cloud-profile-1',
    userId: 'user-1',
    email: 'nina@example.com',
    linkedAt: 3
  },
  capabilities: {
    flags: { share: true },
    refreshedAt: 4
  }
}

const FABRICAProfilesApi = {
  list: vi.fn(),
  authStatus: vi.fn(),
  createLocal: vi.fn(),
  createCloudLinked: vi.fn(),
  connectCurrent: vi.fn(),
  refreshAuth: vi.fn(),
  signOutCurrent: vi.fn(),
  selectOrg: vi.fn(),
  switchProfile: vi.fn(),
  transferProject: vi.fn()
}

describe('FABRICA profile slice', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    toastErrorMock.mockReset()
    FABRICAProfilesApi.authStatus.mockResolvedValue(localAuthStatus)
    vi.stubGlobal('window', {
      api: {
        FABRICAProfiles: FABRICAProfilesApi
      }
    })
  })

  it('fetches profiles into store state', async () => {
    FABRICAProfilesApi.list.mockResolvedValue(listState)
    const store = createTestStore()

    await store.getState().fetchFABRICAProfiles()

    expect(store.getState().activeFABRICAProfileId).toBe('local-default')
    expect(store.getState().FABRICAProfiles).toEqual(listState.profiles)
    expect(store.getState().FABRICAProfileAuthStatus).toEqual(localAuthStatus)
    expect(store.getState().FABRICAProfilesMultiProfileUi).toBe(false)
    expect(store.getState().FABRICAProfilesLoading).toBe(false)
  })

  it('stores the multi-profile UI flag from the list result', async () => {
    FABRICAProfilesApi.list.mockResolvedValue({ ...listState, multiProfileUi: true })
    const store = createTestStore()

    await store.getState().fetchFABRICAProfiles()

    expect(store.getState().FABRICAProfilesMultiProfileUi).toBe(true)
  })

  it('creates a local profile and returns the created summary', async () => {
    FABRICAProfilesApi.createLocal.mockResolvedValue(createdState)
    const store = createTestStore()

    const profile = await store.getState().createLocalFABRICAProfile('Work')

    expect(profile).toEqual(createdState.profile)
    expect(FABRICAProfilesApi.createLocal).toHaveBeenCalledWith({ name: 'Work' })
    expect(store.getState().FABRICAProfiles).toEqual(createdState.profiles)
  })

  it('fetches auth status independently', async () => {
    FABRICAProfilesApi.authStatus.mockResolvedValue(connectedAuthStatus)
    const store = createTestStore()

    await expect(store.getState().fetchFABRICAProfileAuthStatus()).resolves.toEqual(
      connectedAuthStatus
    )
    expect(store.getState().FABRICAProfileAuthStatus).toEqual(connectedAuthStatus)
  })

  it('sets switching state while requesting a profile switch', async () => {
    FABRICAProfilesApi.switchProfile.mockResolvedValue({ status: 'relaunching' })
    const store = createTestStore()
    store.setState({ activeFABRICAProfileId: 'local-default' })

    const result = await store.getState().switchFABRICAProfile('local-work')

    expect(result).toEqual({ status: 'relaunching' })
    expect(FABRICAProfilesApi.switchProfile).toHaveBeenCalledWith({ profileId: 'local-work' })
    expect(store.getState().FABRICAProfileSwitching).toBe(true)
  })

  it('releases switching state when main reports the profile is already active', async () => {
    // Why: a stale renderer activeFABRICAProfileId must not lock the switcher
    // forever when no relaunch is actually coming.
    FABRICAProfilesApi.switchProfile.mockResolvedValue({ status: 'already-active' })
    const store = createTestStore()
    store.setState({ activeFABRICAProfileId: 'local-default' })

    const result = await store.getState().switchFABRICAProfile('local-work')

    expect(result).toEqual({ status: 'already-active' })
    expect(store.getState().FABRICAProfileSwitching).toBe(false)
  })

  it('does not call main when switching to the active profile', async () => {
    const store = createTestStore()
    store.setState({ activeFABRICAProfileId: 'local-default' })

    const result = await store.getState().switchFABRICAProfile('local-default')

    expect(result).toEqual({ status: 'already-active' })
    expect(FABRICAProfilesApi.switchProfile).not.toHaveBeenCalled()
  })

  it('transfers projects through the profile API', async () => {
    const transferResult: TransferFABRICAProfileProjectResult = {
      status: 'transferred',
      mode: 'copy',
      sourceProfileId: 'local-default',
      targetProfileId: 'local-work',
      sourceRepoId: 'repo-1',
      targetRepoId: 'repo-2',
      targetProjectId: 'repo:repo-2'
    }
    FABRICAProfilesApi.transferProject.mockResolvedValue(transferResult)
    const store = createTestStore()

    const result = await store.getState().transferFABRICAProfileProject({
      sourceProfileId: 'local-default',
      targetProfileId: 'local-work',
      repoId: 'repo-1',
      mode: 'copy'
    })

    expect(result).toEqual(transferResult)
    expect(FABRICAProfilesApi.transferProject).toHaveBeenCalledWith({
      sourceProfileId: 'local-default',
      targetProfileId: 'local-work',
      repoId: 'repo-1',
      mode: 'copy'
    })
  })

  it('marks profile switching when a project transfer relaunches the app', async () => {
    const transferResult: TransferFABRICAProfileProjectResult = {
      status: 'transferred',
      mode: 'move',
      sourceProfileId: 'local-default',
      targetProfileId: 'local-work',
      sourceRepoId: 'repo-1',
      targetRepoId: 'repo-1',
      targetProjectId: 'repo:repo-1',
      willRelaunch: true
    }
    FABRICAProfilesApi.transferProject.mockResolvedValue(transferResult)
    const store = createTestStore()

    await store.getState().transferFABRICAProfileProject({
      sourceProfileId: 'local-default',
      targetProfileId: 'local-work',
      repoId: 'repo-1',
      mode: 'move'
    })

    expect(store.getState().FABRICAProfileSwitching).toBe(true)
  })

  it('warns when a project already exists in the target profile', async () => {
    const transferResult: TransferFABRICAProfileProjectResult = {
      status: 'duplicate-target',
      sourceProfileId: 'local-default',
      targetProfileId: 'local-work',
      sourceRepoId: 'repo-1',
      duplicateRepoId: 'repo-existing'
    }
    FABRICAProfilesApi.transferProject.mockResolvedValue(transferResult)
    const store = createTestStore()

    await store.getState().transferFABRICAProfileProject({
      sourceProfileId: 'local-default',
      targetProfileId: 'local-work',
      repoId: 'repo-1',
      mode: 'copy'
    })

    expect(toastErrorMock).toHaveBeenCalledWith('Project already exists in that profile')
    expect(store.getState().FABRICAProfileSwitching).toBe(false)
  })
})
