import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  handlers,
  createCloudLinkedFABRICAProfileMock,
  connectCurrentFABRICAProfileMock,
  getCurrentFABRICAProfileAuthStatusMock,
  refreshCurrentFABRICAProfileAuthMock,
  selectCurrentFABRICAProfileOrgMock,
  signOutCurrentFABRICAProfileMock
} = vi.hoisted(() => ({
  handlers: new Map<string, (_event: unknown, args?: unknown) => unknown>(),
  createCloudLinkedFABRICAProfileMock: vi.fn(),
  connectCurrentFABRICAProfileMock: vi.fn(),
  getCurrentFABRICAProfileAuthStatusMock: vi.fn(),
  refreshCurrentFABRICAProfileAuthMock: vi.fn(),
  selectCurrentFABRICAProfileOrgMock: vi.fn(),
  signOutCurrentFABRICAProfileMock: vi.fn()
}))

vi.mock('electron', () => ({
  app: {
    exit: vi.fn(),
    getPath: () => '/tmp/FABRICA-user-data',
    relaunch: vi.fn()
  },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (_event: unknown, args?: unknown) => unknown) => {
      handlers.set(channel, handler)
    })
  }
}))

vi.mock('../tray/system-tray', () => ({
  destroySystemTray: vi.fn()
}))

vi.mock('../fabrica-profiles/profile-index-store', () => ({
  createLocalFABRICAProfile: vi.fn(),
  getFABRICAProfileListState: vi.fn(),
  seedNewFABRICAProfileTelemetryConsent: vi.fn(),
  setActiveFABRICAProfile: vi.fn()
}))

vi.mock('../fabrica-profiles/profile-project-transfer', () => ({
  transferFABRICAProfileProject: vi.fn()
}))

vi.mock('../fabrica-profiles/profile-cloud-service', () => ({
  createCloudLinkedFABRICAProfile: createCloudLinkedFABRICAProfileMock,
  connectCurrentFABRICAProfile: connectCurrentFABRICAProfileMock,
  getCurrentFABRICAProfileAuthStatus: getCurrentFABRICAProfileAuthStatusMock,
  refreshCurrentFABRICAProfileAuth: refreshCurrentFABRICAProfileAuthMock,
  selectCurrentFABRICAProfileOrg: selectCurrentFABRICAProfileOrgMock,
  signOutCurrentFABRICAProfile: signOutCurrentFABRICAProfileMock
}))

import { registerFABRICAProfileHandlers } from './fabrica-profiles'

describe('registerFABRICAProfileHandlers auth channels', () => {
  beforeEach(() => {
    handlers.clear()
    createCloudLinkedFABRICAProfileMock.mockReset()
    connectCurrentFABRICAProfileMock.mockReset()
    getCurrentFABRICAProfileAuthStatusMock.mockReset()
    refreshCurrentFABRICAProfileAuthMock.mockReset()
    selectCurrentFABRICAProfileOrgMock.mockReset()
    signOutCurrentFABRICAProfileMock.mockReset()
  })

  it('returns auth status for the current profile', async () => {
    const status = {
      activeProfileId: 'local-default',
      configured: false,
      state: 'unconfigured',
      persistence: 'none'
    }
    getCurrentFABRICAProfileAuthStatusMock.mockReturnValue(status)
    registerFABRICAProfileHandlers({
      flush: vi.fn(),
      freezeWrites: vi.fn(),
      getSettings: () => ({})
    } as never)

    await expect(Promise.resolve(handlers.get('FABRICAProfiles:authStatus')?.(null))).resolves.toBe(
      status
    )
    expect(getCurrentFABRICAProfileAuthStatusMock).toHaveBeenCalledWith('/tmp/FABRICA-user-data')
  })

  it('connects and signs out the current profile through the cloud service', async () => {
    const connectResult = { status: 'unconfigured', auth: { activeProfileId: 'local-default' } }
    const signOutResult = { status: 'signed-out', auth: { activeProfileId: 'local-default' } }
    connectCurrentFABRICAProfileMock.mockResolvedValue(connectResult)
    signOutCurrentFABRICAProfileMock.mockResolvedValue(signOutResult)
    registerFABRICAProfileHandlers({
      flush: vi.fn(),
      freezeWrites: vi.fn(),
      getSettings: () => ({})
    } as never)

    await expect(
      Promise.resolve(handlers.get('FABRICAProfiles:connectCurrent')?.(null))
    ).resolves.toBe(connectResult)
    await expect(
      Promise.resolve(handlers.get('FABRICAProfiles:signOutCurrent')?.(null))
    ).resolves.toBe(signOutResult)
    expect(connectCurrentFABRICAProfileMock).toHaveBeenCalledWith('/tmp/FABRICA-user-data')
    expect(signOutCurrentFABRICAProfileMock).toHaveBeenCalledWith('/tmp/FABRICA-user-data')
  })

  it('refreshes profile auth through the cloud service', async () => {
    const refreshResult = { status: 'refreshed', auth: { activeProfileId: 'local-default' } }
    refreshCurrentFABRICAProfileAuthMock.mockResolvedValue(refreshResult)
    registerFABRICAProfileHandlers({
      flush: vi.fn(),
      freezeWrites: vi.fn(),
      getSettings: () => ({})
    } as never)

    await expect(Promise.resolve(handlers.get('FABRICAProfiles:refreshAuth')?.(null))).resolves.toBe(
      refreshResult
    )
    expect(refreshCurrentFABRICAProfileAuthMock).toHaveBeenCalledWith('/tmp/FABRICA-user-data')
  })

  it('validates organization selection before calling the cloud service', async () => {
    const selectResult = { status: 'selected', auth: { activeProfileId: 'local-default' } }
    selectCurrentFABRICAProfileOrgMock.mockResolvedValue(selectResult)
    registerFABRICAProfileHandlers({
      flush: vi.fn(),
      freezeWrites: vi.fn(),
      getSettings: () => ({})
    } as never)

    await expect(
      Promise.resolve(handlers.get('FABRICAProfiles:selectOrg')?.(null, { orgId: ' org-1 ' }))
    ).resolves.toBe(selectResult)
    expect(selectCurrentFABRICAProfileOrgMock).toHaveBeenCalledWith('/tmp/FABRICA-user-data', 'org-1')

    await expect(
      Promise.resolve(handlers.get('FABRICAProfiles:selectOrg')?.(null, { orgId: ' ' }))
    ).rejects.toThrow('invalid_FABRICA_profile_org_selection')
  })

  it('creates cloud-linked profiles with trimmed optional args', async () => {
    const createResult = {
      status: 'created',
      auth: { activeProfileId: 'local-default' },
      activeProfileId: 'local-default',
      profiles: [],
      profile: { id: 'cloud-1' }
    }
    createCloudLinkedFABRICAProfileMock.mockResolvedValue(createResult)
    registerFABRICAProfileHandlers({
      flush: vi.fn(),
      freezeWrites: vi.fn(),
      getSettings: () => ({})
    } as never)

    await expect(
      Promise.resolve(
        handlers.get('FABRICAProfiles:createCloudLinked')?.(null, { orgId: ' org-1 ', name: ' Acme ' })
      )
    ).resolves.toBe(createResult)
    expect(createCloudLinkedFABRICAProfileMock).toHaveBeenCalledWith('/tmp/FABRICA-user-data', {
      orgId: 'org-1',
      name: 'Acme'
    })
  })
})
