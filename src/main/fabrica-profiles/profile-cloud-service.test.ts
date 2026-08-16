import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type {
  FABRICACloudCapabilities,
  FABRICACloudOrgSummary,
  FABRICAProfileCloudSummary
} from '../../shared/fabrica-profiles'
import type { FABRICACloudSessionExchangeResponse } from './profile-cloud-session-exchange'

const {
  beginFABRICACloudPkceFlowMock,
  createFABRICACloudProfileMock,
  exchangeFABRICACloudAuthCodeMock,
  revokeFABRICACloudSessionMock,
  selectFABRICACloudOrgMock,
  safeStorageMock
} = vi.hoisted(() => ({
  beginFABRICACloudPkceFlowMock: vi.fn(),
  createFABRICACloudProfileMock: vi.fn(),
  exchangeFABRICACloudAuthCodeMock: vi.fn(),
  revokeFABRICACloudSessionMock: vi.fn(),
  selectFABRICACloudOrgMock: vi.fn(),
  safeStorageMock: {
    decryptString: vi.fn((value: Buffer) => value.toString('utf-8')),
    encryptString: vi.fn((value: string) => Buffer.from(value, 'utf-8')),
    isEncryptionAvailable: vi.fn(() => true)
  }
}))

let userDataPath = ''

vi.mock('electron', () => ({
  app: {
    getPath: () => userDataPath
  },
  safeStorage: safeStorageMock
}))

vi.mock('./profile-cloud-pkce', () => ({
  beginFABRICACloudPkceFlow: beginFABRICACloudPkceFlowMock
}))

vi.mock('./profile-cloud-client', () => ({
  createFABRICACloudProfile: createFABRICACloudProfileMock,
  exchangeFABRICACloudAuthCode: exchangeFABRICACloudAuthCodeMock,
  revokeFABRICACloudSession: revokeFABRICACloudSessionMock,
  selectFABRICACloudOrg: selectFABRICACloudOrgMock
}))

import {
  connectCurrentFABRICAProfile,
  createCloudLinkedFABRICAProfile,
  getCurrentFABRICAProfileAuthStatus,
  selectCurrentFABRICAProfileOrg,
  signOutCurrentFABRICAProfile
} from './profile-cloud-service'

const cloudSummary: FABRICAProfileCloudSummary = {
  cloudProfileId: 'cloud-profile-1',
  userId: 'user-1',
  email: 'nina@example.com',
  displayName: 'Nina',
  linkedAt: 10
}

const capabilities: FABRICACloudCapabilities = {
  flags: { share: true },
  refreshedAt: 11
}

const organizations: FABRICACloudOrgSummary[] = [
  { orgId: 'org-1', name: 'Acme', role: 'Admin' },
  { orgId: 'org-2', name: 'Personal' }
]

function configureCloudEnv(): void {
  vi.stubEnv('FABRICA_CLOUD_API_URL', 'https://FABRICA-cloud.example')
  vi.stubEnv('FABRICA_CLOUD_CLIENT_ID', 'desktop-client')
}

function futureExpiresAt(): number {
  return Date.now() + 3_600_000
}

function mockSuccessfulConnect(expiresAt = futureExpiresAt()): void {
  beginFABRICACloudPkceFlowMock.mockResolvedValue({
    code: 'auth-code',
    codeVerifier: 'code-verifier',
    nonce: 'nonce',
    redirectUri: 'http://127.0.0.1:4100/auth/callback',
    state: 'state'
  })
  exchangeFABRICACloudAuthCodeMock.mockResolvedValue({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt,
    cloud: cloudSummary,
    organizations,
    capabilities
  } satisfies FABRICACloudSessionExchangeResponse)
}

describe('FABRICA cloud profile service', () => {
  beforeEach(() => {
    userDataPath = mkdtempSync(join(tmpdir(), 'FABRICA-cloud-service-'))
    beginFABRICACloudPkceFlowMock.mockReset()
    createFABRICACloudProfileMock.mockReset()
    exchangeFABRICACloudAuthCodeMock.mockReset()
    revokeFABRICACloudSessionMock.mockReset()
    selectFABRICACloudOrgMock.mockReset()
    safeStorageMock.decryptString.mockReset()
    safeStorageMock.encryptString.mockReset()
    safeStorageMock.isEncryptionAvailable.mockReset()
    safeStorageMock.decryptString.mockImplementation((value: Buffer) => value.toString('utf-8'))
    safeStorageMock.encryptString.mockImplementation((value: string) => Buffer.from(value, 'utf-8'))
    safeStorageMock.isEncryptionAvailable.mockReturnValue(true)
    revokeFABRICACloudSessionMock.mockResolvedValue(undefined)
    vi.unstubAllEnvs()
    vi.stubEnv('FABRICA_CLOUD_API_URL', '')
    vi.stubEnv('FABRICA_CLOUD_CLIENT_ID', '')
  })

  afterEach(() => {
    rmSync(userDataPath, { recursive: true, force: true })
    vi.unstubAllEnvs()
  })

  it('reports local unconfigured auth without cloud setup', () => {
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath)).toMatchObject({
      activeProfileId: 'local-default',
      configured: false,
      state: 'unconfigured',
      persistence: 'none'
    })
  })

  it('connects the active local profile without replacing its local profile ID', async () => {
    configureCloudEnv()
    mockSuccessfulConnect()

    const result = await connectCurrentFABRICAProfile(userDataPath)

    if (result.status !== 'connected') {
      throw new Error(`Expected connected result, got ${result.status}`)
    }
    expect(result.activeProfileId).toBe('local-default')
    expect(result.profiles[0]).toMatchObject({
      id: 'local-default',
      kind: 'cloud-linked',
      cloud: cloudSummary
    })
    expect(exchangeFABRICACloudAuthCodeMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ localProfileId: 'local-default', nonce: 'nonce' })
    )
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath)).toMatchObject({
      state: 'connected',
      persistence: 'encrypted',
      cloud: cloudSummary,
      organizations,
      capabilities
    })
  })

  it('treats provider-denied sign-in as a cancelled connect attempt', async () => {
    configureCloudEnv()
    beginFABRICACloudPkceFlowMock.mockRejectedValue(new Error('FABRICA_cloud_auth_denied'))

    const result = await connectCurrentFABRICAProfile(userDataPath)

    expect(result.status).toBe('cancelled')
    expect(exchangeFABRICACloudAuthCodeMock).not.toHaveBeenCalled()
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath)).toMatchObject({
      state: 'local',
      persistence: 'none'
    })
  })

  it('does not report a saved cloud session as connected when cloud config is unavailable', async () => {
    configureCloudEnv()
    mockSuccessfulConnect()
    await connectCurrentFABRICAProfile(userDataPath)
    vi.stubEnv('FABRICA_CLOUD_API_URL', '')
    vi.stubEnv('FABRICA_CLOUD_CLIENT_ID', '')

    expect(getCurrentFABRICAProfileAuthStatus(userDataPath)).toMatchObject({
      configured: false,
      state: 'unconfigured',
      persistence: 'encrypted',
      cloud: cloudSummary,
      setupMessage: 'FABRICA Cloud sign-in is not configured for this build.'
    })
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath).organizations).toBeUndefined()
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath).capabilities).toBeUndefined()
  })

  it('signs out by removing cloud metadata while keeping the local profile', async () => {
    configureCloudEnv()
    mockSuccessfulConnect()
    await connectCurrentFABRICAProfile(userDataPath)

    const result = await signOutCurrentFABRICAProfile(userDataPath)

    expect(result.status).toBe('signed-out')
    expect(result.activeProfileId).toBe('local-default')
    expect(result.profiles[0]).toMatchObject({ id: 'local-default', kind: 'local' })
    expect(result.profiles[0]?.cloud).toBeUndefined()
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath)).toMatchObject({
      state: 'local',
      persistence: 'none'
    })
    expect(revokeFABRICACloudSessionMock).toHaveBeenCalledOnce()
  })

  it('creates a new empty cloud-linked profile with its own cloud session', async () => {
    configureCloudEnv()
    mockSuccessfulConnect()
    await connectCurrentFABRICAProfile(userDataPath)
    createFABRICACloudProfileMock.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresAt: 1000,
      cloud: {
        ...cloudSummary,
        cloudProfileId: 'cloud-profile-2',
        activeOrgId: 'org-1',
        activeOrgName: 'Acme'
      },
      organizations,
      capabilities: { flags: { share: true, team: true }, refreshedAt: 13 }
    } satisfies FABRICACloudSessionExchangeResponse)

    const result = await createCloudLinkedFABRICAProfile(userDataPath, {
      orgId: 'org-1',
      name: 'Acme'
    })

    if (result.status !== 'created') {
      throw new Error(`Expected created result, got ${result.status}`)
    }
    expect(result.profile).toMatchObject({
      id: expect.stringMatching(/^cloud-/),
      name: 'Acme',
      kind: 'cloud-linked',
      cloud: expect.objectContaining({ cloudProfileId: 'cloud-profile-2' })
    })
    expect(createFABRICACloudProfileMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ accessToken: 'access-token' }),
      { orgId: 'org-1', name: 'Acme' }
    )
  })

  it('selects an organization for a connected profile', async () => {
    configureCloudEnv()
    mockSuccessfulConnect()
    await connectCurrentFABRICAProfile(userDataPath)
    const orgCloudSummary = {
      ...cloudSummary,
      activeOrgId: 'org-1',
      activeOrgName: 'Acme'
    }
    selectFABRICACloudOrgMock.mockResolvedValue({
      cloud: orgCloudSummary,
      organizations,
      capabilities: { flags: { share: true, sso: true }, refreshedAt: 12 }
    })

    const result = await selectCurrentFABRICAProfileOrg(userDataPath, 'org-1')

    expect(result.status).toBe('selected')
    expect(selectFABRICACloudOrgMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ accessToken: 'access-token' }),
      'org-1'
    )
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath).cloud).toMatchObject({
      activeOrgId: 'org-1',
      activeOrgName: 'Acme'
    })
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath).organizations).toEqual(organizations)
  })
})
