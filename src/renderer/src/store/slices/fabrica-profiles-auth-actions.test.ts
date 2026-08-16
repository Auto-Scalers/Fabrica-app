import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestStore } from './store-test-helpers'
import type {
  ConnectCurrentFABRICAProfileResult,
  CreateCloudLinkedFABRICAProfileResult,
  FABRICAProfileAuthStatus,
  FABRICAProfileListState,
  RefreshCurrentFABRICAProfileAuthResult,
  SelectFABRICAProfileOrgResult,
  SignOutCurrentFABRICAProfileResult
} from '../../../../shared/fabrica-profiles'

const listState: FABRICAProfileListState = {
  activeProfileId: 'local-default',
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

const localAuthStatus: FABRICAProfileAuthStatus = {
  activeProfileId: 'local-default',
  configured: false,
  state: 'unconfigured',
  persistence: 'none'
}

const connectedCloud = {
  cloudProfileId: 'cloud-profile-1',
  userId: 'user-1',
  email: 'nina@example.com',
  linkedAt: 3
}

const connectedOrganizations = [
  { orgId: 'org-1', name: 'Acme', role: 'Admin' },
  { orgId: 'org-2', name: 'Personal' }
]

const connectedAuthStatus: FABRICAProfileAuthStatus = {
  activeProfileId: 'local-default',
  configured: true,
  state: 'connected',
  persistence: 'encrypted',
  cloud: connectedCloud,
  organizations: connectedOrganizations,
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

describe('FABRICA profile auth actions slice', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    FABRICAProfilesApi.authStatus.mockResolvedValue(localAuthStatus)
    vi.stubGlobal('window', {
      api: {
        FABRICAProfiles: FABRICAProfilesApi
      }
    })
  })

  it('connects the current profile and stores returned cloud metadata', async () => {
    const connectedProfiles = [
      {
        ...listState.profiles[0],
        kind: 'cloud-linked' as const,
        cloud: connectedAuthStatus.cloud
      }
    ]
    const result: ConnectCurrentFABRICAProfileResult = {
      status: 'connected',
      auth: connectedAuthStatus,
      activeProfileId: 'local-default',
      profiles: connectedProfiles
    }
    FABRICAProfilesApi.connectCurrent.mockResolvedValue(result)
    const store = createTestStore()

    const pending = store.getState().connectCurrentFABRICAProfile()

    expect(store.getState().FABRICAProfileConnecting).toBe(true)
    await expect(pending).resolves.toEqual(result)
    expect(store.getState().FABRICAProfileConnecting).toBe(false)
    expect(store.getState().FABRICAProfileAuthStatus).toEqual(connectedAuthStatus)
    expect(store.getState().FABRICAProfiles).toEqual(connectedProfiles)
  })

  it('refreshes current profile auth and stores fresh capability flags', async () => {
    const refreshedAuthStatus: FABRICAProfileAuthStatus = {
      ...connectedAuthStatus,
      capabilities: {
        flags: { share: false, team: true },
        refreshedAt: 8
      }
    }
    const result: RefreshCurrentFABRICAProfileAuthResult = {
      status: 'refreshed',
      auth: refreshedAuthStatus,
      activeProfileId: 'local-default',
      profiles: [
        {
          ...listState.profiles[0],
          kind: 'cloud-linked',
          cloud: refreshedAuthStatus.cloud
        }
      ]
    }
    FABRICAProfilesApi.refreshAuth.mockResolvedValue(result)
    const store = createTestStore()

    await expect(store.getState().refreshCurrentFABRICAProfileAuth()).resolves.toEqual(result)
    expect(FABRICAProfilesApi.refreshAuth).toHaveBeenCalledOnce()
    expect(store.getState().FABRICAProfileAuthStatus).toEqual(refreshedAuthStatus)
    expect(store.getState().FABRICAProfiles).toEqual(result.profiles)
  })

  it('creates a cloud-linked profile and stores the returned profile list', async () => {
    const cloudProfile = {
      id: 'cloud-acme',
      name: 'Acme',
      avatar: { kind: 'initials' as const, initials: 'A', color: 'neutral' as const },
      kind: 'cloud-linked' as const,
      createdAt: 5,
      updatedAt: 5,
      lastOpenedAt: 5,
      cloud: {
        ...connectedCloud,
        cloudProfileId: 'cloud-profile-2',
        activeOrgId: 'org-1',
        activeOrgName: 'Acme'
      }
    }
    const result: CreateCloudLinkedFABRICAProfileResult = {
      status: 'created',
      auth: connectedAuthStatus,
      activeProfileId: 'local-default',
      profiles: [...listState.profiles, cloudProfile],
      profile: cloudProfile
    }
    FABRICAProfilesApi.createCloudLinked.mockResolvedValue(result)
    const store = createTestStore()

    await expect(
      store.getState().createCloudLinkedFABRICAProfile({ orgId: 'org-1', name: 'Acme' })
    ).resolves.toEqual(result)
    expect(FABRICAProfilesApi.createCloudLinked).toHaveBeenCalledWith({
      orgId: 'org-1',
      name: 'Acme'
    })
    expect(store.getState().FABRICAProfiles).toEqual(result.profiles)
  })

  it('signs out the current profile without dropping local profile data', async () => {
    const result: SignOutCurrentFABRICAProfileResult = {
      status: 'signed-out',
      auth: localAuthStatus,
      activeProfileId: 'local-default',
      profiles: listState.profiles
    }
    FABRICAProfilesApi.signOutCurrent.mockResolvedValue(result)
    const store = createTestStore()

    await expect(store.getState().signOutCurrentFABRICAProfile()).resolves.toEqual(result)
    expect(store.getState().FABRICAProfileAuthStatus).toEqual(localAuthStatus)
    expect(store.getState().FABRICAProfiles).toEqual(listState.profiles)
  })

  it('selects a cloud organization and refreshes auth state', async () => {
    const selectedAuthStatus: FABRICAProfileAuthStatus = {
      ...connectedAuthStatus,
      cloud: {
        ...connectedCloud,
        activeOrgId: 'org-1',
        activeOrgName: 'Acme'
      }
    }
    const result: SelectFABRICAProfileOrgResult = {
      status: 'selected',
      auth: selectedAuthStatus,
      activeProfileId: 'local-default',
      profiles: [
        {
          ...listState.profiles[0],
          kind: 'cloud-linked',
          cloud: selectedAuthStatus.cloud
        }
      ]
    }
    FABRICAProfilesApi.selectOrg.mockResolvedValue(result)
    const store = createTestStore()

    await expect(store.getState().selectFABRICAProfileOrg('org-1')).resolves.toEqual(result)
    expect(FABRICAProfilesApi.selectOrg).toHaveBeenCalledWith({ orgId: 'org-1' })
    expect(store.getState().FABRICAProfileAuthStatus).toEqual(selectedAuthStatus)
    expect(store.getState().FABRICAProfileAuthStatus?.organizations).toEqual(connectedOrganizations)
  })
})
