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
  selectFABRICACloudOrgMock,
  FABRICACloudRequestErrorMock,
  safeStorageMock
} = vi.hoisted(() => ({
  beginFABRICACloudPkceFlowMock: vi.fn(),
  createFABRICACloudProfileMock: vi.fn(),
  exchangeFABRICACloudAuthCodeMock: vi.fn(),
  refreshFABRICACloudCapabilitiesMock: vi.fn(),
  refreshFABRICACloudSessionMock: vi.fn(),
  selectFABRICACloudOrgMock: vi.fn(),
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
  selectFABRICACloudOrg: selectFABRICACloudOrgMock
}))

import {
  connectCurrentFABRICAProfile,
  createCloudLinkedFABRICAProfile,
  getCurrentFABRICAProfileAuthStatus,
  refreshCurrentFABRICAProfileAuth,
  selectCurrentFABRICAProfileOrg
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

function mockSuccessfulConnect(): void {
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
    expiresAt: futureExpiresAt(),
    cloud: cloudSummary,
    organizations,
    capabilities
  } satisfies FABRICACloudSessionExchangeResponse)
}

function mockSuccessfulSessionRefresh(): void {
  refreshFABRICACloudSessionMock.mockResolvedValue({
    accessToken: 'rotated-access-token',
    refreshToken: 'rotated-refresh-token',
    expiresAt: futureExpiresAt(),
    cloud: cloudSummary,
    organizations,
    capabilities
  } satisfies FABRICACloudSessionExchangeResponse)
}

describe('FABRICA cloud profile auth-failure retry', () => {
  beforeEach(() => {
    userDataPath = mkdtempSync(join(tmpdir(), 'FABRICA-cloud-service-auth-retry-'))
    beginFABRICACloudPkceFlowMock.mockReset()
    createFABRICACloudProfileMock.mockReset()
    exchangeFABRICACloudAuthCodeMock.mockReset()
    refreshFABRICACloudCapabilitiesMock.mockReset()
    refreshFABRICACloudSessionMock.mockReset()
    selectFABRICACloudOrgMock.mockReset()
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

  it('refreshes and retries cloud profile creation after an auth failure', async () => {
    configureCloudEnv()
    mockSuccessfulConnect()
    mockSuccessfulSessionRefresh()
    await connectCurrentFABRICAProfile(userDataPath)
    createFABRICACloudProfileMock
      .mockRejectedValueOnce(new FABRICACloudRequestErrorMock(401))
      .mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: futureExpiresAt(),
        cloud: { ...cloudSummary, cloudProfileId: 'cloud-profile-2' },
        organizations,
        capabilities
      } satisfies FABRICACloudSessionExchangeResponse)

    const result = await createCloudLinkedFABRICAProfile(userDataPath, { name: 'Acme' })

    expect(result.status).toBe('created')
    expect(createFABRICACloudProfileMock).toHaveBeenNthCalledWith(
      2,
      expect.any(Object),
      expect.objectContaining({ accessToken: 'rotated-access-token' }),
      { name: 'Acme' }
    )
  })

  it('refreshes and retries capability refresh after an auth failure', async () => {
    configureCloudEnv()
    mockSuccessfulConnect()
    mockSuccessfulSessionRefresh()
    await connectCurrentFABRICAProfile(userDataPath)
    refreshFABRICACloudCapabilitiesMock
      .mockRejectedValueOnce(new FABRICACloudRequestErrorMock(403))
      .mockResolvedValue({
        capabilities: { flags: { share: false }, refreshedAt: 26 } satisfies FABRICACloudCapabilities
      })

    const result = await refreshCurrentFABRICAProfileAuth(userDataPath)

    expect(result.status).toBe('refreshed')
    expect(refreshFABRICACloudCapabilitiesMock).toHaveBeenNthCalledWith(
      2,
      expect.any(Object),
      expect.objectContaining({ accessToken: 'rotated-access-token' })
    )
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath).capabilities).toEqual({
      flags: { share: false },
      refreshedAt: 26
    })
  })

  it('requires reconnect when a retried capability refresh is still unauthorized', async () => {
    configureCloudEnv()
    mockSuccessfulConnect()
    mockSuccessfulSessionRefresh()
    await connectCurrentFABRICAProfile(userDataPath)
    refreshFABRICACloudCapabilitiesMock
      .mockRejectedValueOnce(new FABRICACloudRequestErrorMock(401))
      .mockRejectedValueOnce(new FABRICACloudRequestErrorMock(401))

    const result = await refreshCurrentFABRICAProfileAuth(userDataPath)

    expect(result.status).toBe('reconnect-required')
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath)).toMatchObject({
      state: 'reconnect-required',
      persistence: 'none',
      cloud: cloudSummary
    })
  })

  it('refreshes and retries organization selection after an auth failure', async () => {
    configureCloudEnv()
    mockSuccessfulConnect()
    mockSuccessfulSessionRefresh()
    await connectCurrentFABRICAProfile(userDataPath)
    selectFABRICACloudOrgMock
      .mockRejectedValueOnce(new FABRICACloudRequestErrorMock(401))
      .mockResolvedValue({
        cloud: { ...cloudSummary, activeOrgId: 'org-1', activeOrgName: 'Acme' },
        organizations,
        capabilities
      })

    const result = await selectCurrentFABRICAProfileOrg(userDataPath, 'org-1')

    expect(result.status).toBe('selected')
    expect(selectFABRICACloudOrgMock).toHaveBeenNthCalledWith(
      2,
      expect.any(Object),
      expect.objectContaining({ accessToken: 'rotated-access-token' }),
      'org-1'
    )
  })
})
