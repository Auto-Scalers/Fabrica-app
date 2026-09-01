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
  refreshFABRICACloudCapabilitiesMock,
  refreshFABRICACloudSessionMock,
  FABRICACloudRequestErrorMock,
  safeStorageMock
} = vi.hoisted(() => ({
  beginFABRICACloudPkceFlowMock: vi.fn(),
  createFABRICACloudProfileMock: vi.fn(),
  exchangeFABRICACloudAuthCodeMock: vi.fn(),
  refreshFABRICACloudCapabilitiesMock: vi.fn(),
  refreshFABRICACloudSessionMock: vi.fn(),
  FABRICACloudRequestErrorMock: class FABRICACloudRequestError extends Error {
    constructor(public readonly statusCode: number) {
      super(`FABRICA_cloud_request_failed_${statusCode}`)
      this.name = 'FABRICACloudRequestError'
    }
  },
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
  FABRICACloudRequestError: FABRICACloudRequestErrorMock,
  createFABRICACloudProfile: createFABRICACloudProfileMock,
  exchangeFABRICACloudAuthCode: exchangeFABRICACloudAuthCodeMock,
  refreshFABRICACloudCapabilities: refreshFABRICACloudCapabilitiesMock,
  refreshFABRICACloudSession: refreshFABRICACloudSessionMock,
  revokeFABRICACloudSession: vi.fn(),
  selectFABRICACloudOrg: vi.fn()
}))

import {
  connectCurrentFABRICAProfile,
  createCloudLinkedFABRICAProfile,
  getCurrentFABRICAProfileAuthStatus,
  refreshCurrentFABRICAProfileAuth
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

function futureExpiresAt(): number {
  return Date.now() + 3_600_000
}

function configureCloudEnv(): void {
  vi.stubEnv('FABRICA_CLOUD_API_URL', 'https://FABRICA-cloud.example')
  vi.stubEnv('FABRICA_CLOUD_CLIENT_ID', 'desktop-client')
}

function mockSuccessfulConnect(expiresAt = futureExpiresAt()): void {
  beginFABRICACloudPkceFlowMock.mockResolvedValue({
    kind: 'code',
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

describe('FABRICA cloud profile service session refresh', () => {
  beforeEach(() => {
    userDataPath = mkdtempSync(join(tmpdir(), 'FABRICA-cloud-service-refresh-'))
    beginFABRICACloudPkceFlowMock.mockReset()
    createFABRICACloudProfileMock.mockReset()
    exchangeFABRICACloudAuthCodeMock.mockReset()
    refreshFABRICACloudCapabilitiesMock.mockReset()
    refreshFABRICACloudSessionMock.mockReset()
    safeStorageMock.decryptString.mockReset()
    safeStorageMock.encryptString.mockReset()
    safeStorageMock.isEncryptionAvailable.mockReset()
    safeStorageMock.decryptString.mockImplementation((value: Buffer) => value.toString('utf-8'))
    safeStorageMock.encryptString.mockImplementation((value: string) => Buffer.from(value, 'utf-8'))
    safeStorageMock.isEncryptionAvailable.mockReturnValue(true)
    vi.unstubAllEnvs()
    vi.stubEnv('FABRICA_CLOUD_API_URL', '')
    vi.stubEnv('FABRICA_CLOUD_CLIENT_ID', '')
  })

  afterEach(() => {
    rmSync(userDataPath, { recursive: true, force: true })
    vi.unstubAllEnvs()
  })

  it('refreshes an expired access token before creating cloud profiles', async () => {
    configureCloudEnv()
    mockSuccessfulConnect(Date.now() - 1_000)
    await connectCurrentFABRICAProfile(userDataPath)
    refreshFABRICACloudSessionMock.mockResolvedValue({
      accessToken: 'rotated-access-token',
      refreshToken: 'rotated-refresh-token',
      expiresAt: futureExpiresAt(),
      cloud: cloudSummary,
      organizations,
      capabilities
    } satisfies FABRICACloudSessionExchangeResponse)
    createFABRICACloudProfileMock.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresAt: futureExpiresAt(),
      cloud: {
        ...cloudSummary,
        cloudProfileId: 'cloud-profile-2',
        activeOrgId: 'org-1',
        activeOrgName: 'Acme'
      },
      organizations,
      capabilities
    } satisfies FABRICACloudSessionExchangeResponse)

    const result = await createCloudLinkedFABRICAProfile(userDataPath, {
      orgId: 'org-1',
      name: 'Acme'
    })

    expect(result.status).toBe('created')
    expect(refreshFABRICACloudSessionMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ refreshToken: 'refresh-token' })
    )
    expect(createFABRICACloudProfileMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ accessToken: 'rotated-access-token' }),
      { orgId: 'org-1', name: 'Acme' }
    )
  })

  it('refreshes capability flags for the connected profile', async () => {
    configureCloudEnv()
    mockSuccessfulConnect()
    await connectCurrentFABRICAProfile(userDataPath)
    refreshFABRICACloudCapabilitiesMock.mockResolvedValue({
      capabilities: {
        flags: { share: false, team: true },
        refreshedAt: 25
      }
    })

    const result = await refreshCurrentFABRICAProfileAuth(userDataPath)

    expect(result.status).toBe('refreshed')
    expect(refreshFABRICACloudCapabilitiesMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ accessToken: 'access-token' })
    )
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath).capabilities).toEqual({
      flags: { share: false, team: true },
      refreshedAt: 25
    })
  })

  it('clears stale active org metadata when capability refresh returns no active org', async () => {
    configureCloudEnv()
    mockSuccessfulConnect()
    exchangeFABRICACloudAuthCodeMock.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: futureExpiresAt(),
      cloud: { ...cloudSummary, activeOrgId: 'org-1', activeOrgName: 'Acme' },
      organizations,
      capabilities
    } satisfies FABRICACloudSessionExchangeResponse)
    await connectCurrentFABRICAProfile(userDataPath)
    refreshFABRICACloudCapabilitiesMock.mockResolvedValue({
      cloud: cloudSummary,
      organizations: [],
      capabilities: {
        flags: { share: false },
        refreshedAt: 31
      }
    })

    const result = await refreshCurrentFABRICAProfileAuth(userDataPath)
    const status = getCurrentFABRICAProfileAuthStatus(userDataPath)

    expect(result.status).toBe('refreshed')
    expect(status.cloud?.activeOrgId).toBeUndefined()
    expect(status.cloud?.activeOrgName).toBeUndefined()
    expect(status.organizations).toEqual([])
    expect(status.capabilities).toEqual({
      flags: { share: false },
      refreshedAt: 31
    })
  })

  it('requires reconnect when an expired refresh token is rejected', async () => {
    configureCloudEnv()
    mockSuccessfulConnect(Date.now() - 1_000)
    await connectCurrentFABRICAProfile(userDataPath)
    refreshFABRICACloudSessionMock.mockRejectedValue(new FABRICACloudRequestErrorMock(401))

    const result = await refreshCurrentFABRICAProfileAuth(userDataPath)

    expect(result.status).toBe('reconnect-required')
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath)).toMatchObject({
      state: 'reconnect-required',
      persistence: 'none',
      cloud: cloudSummary
    })
  })
})
