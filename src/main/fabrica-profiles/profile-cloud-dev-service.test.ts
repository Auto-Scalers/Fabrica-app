import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const {
  beginFABRICACloudPkceFlowMock,
  exchangeFABRICACloudAuthCodeMock,
  revokeFABRICACloudSessionMock,
  safeStorageMock
} = vi.hoisted(() => ({
  beginFABRICACloudPkceFlowMock: vi.fn(),
  exchangeFABRICACloudAuthCodeMock: vi.fn(),
  revokeFABRICACloudSessionMock: vi.fn(),
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
  createFABRICACloudProfile: vi.fn(),
  exchangeFABRICACloudAuthCode: exchangeFABRICACloudAuthCodeMock,
  refreshFABRICACloudCapabilities: vi.fn(),
  refreshFABRICACloudSession: vi.fn(),
  revokeFABRICACloudSession: revokeFABRICACloudSessionMock,
  selectFABRICACloudOrg: vi.fn()
}))

import {
  connectCurrentFABRICAProfile,
  createCloudLinkedFABRICAProfile,
  getCurrentFABRICAProfileAuthStatus,
  selectCurrentFABRICAProfileOrg,
  signOutCurrentFABRICAProfile
} from './profile-cloud-service'

describe('FABRICA cloud dev auth service', () => {
  beforeEach(() => {
    userDataPath = mkdtempSync(join(tmpdir(), 'FABRICA-cloud-dev-auth-'))
    beginFABRICACloudPkceFlowMock.mockReset()
    exchangeFABRICACloudAuthCodeMock.mockReset()
    revokeFABRICACloudSessionMock.mockReset()
    safeStorageMock.decryptString.mockReset()
    safeStorageMock.encryptString.mockReset()
    safeStorageMock.isEncryptionAvailable.mockReset()
    safeStorageMock.decryptString.mockImplementation((value: Buffer) => value.toString('utf-8'))
    safeStorageMock.encryptString.mockImplementation((value: string) => Buffer.from(value, 'utf-8'))
    safeStorageMock.isEncryptionAvailable.mockReturnValue(true)
    vi.unstubAllEnvs()
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('FABRICA_CLOUD_DEV_AUTH', '1')
    vi.stubEnv('FABRICA_CLOUD_API_URL', '')
    vi.stubEnv('FABRICA_CLOUD_CLIENT_ID', '')
  })

  afterEach(() => {
    rmSync(userDataPath, { recursive: true, force: true })
    vi.unstubAllEnvs()
  })

  it('connects the active profile without PKCE or cloud endpoints', async () => {
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath)).toMatchObject({
      configured: true,
      state: 'local'
    })

    const result = await connectCurrentFABRICAProfile(userDataPath)

    expect(result.status).toBe('connected')
    expect(beginFABRICACloudPkceFlowMock).not.toHaveBeenCalled()
    expect(exchangeFABRICACloudAuthCodeMock).not.toHaveBeenCalled()
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath)).toMatchObject({
      configured: true,
      state: 'connected',
      persistence: 'encrypted',
      cloud: {
        cloudProfileId: 'dev-cloud-local-default',
        email: 'dev@FABRICA.local'
      },
      capabilities: {
        flags: expect.objectContaining({ 'share.create': true })
      }
    })
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath).organizations).toHaveLength(2)
  })

  it('selects dev organizations and creates org-scoped cloud profiles locally', async () => {
    await connectCurrentFABRICAProfile(userDataPath)

    const selected = await selectCurrentFABRICAProfileOrg(userDataPath, 'dev-acme')
    const created = await createCloudLinkedFABRICAProfile(userDataPath, {
      orgId: 'dev-acme',
      name: 'Acme Dev'
    })

    expect(selected.status).toBe('selected')
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath).cloud).toMatchObject({
      activeOrgId: 'dev-acme',
      activeOrgName: 'Acme Dev'
    })
    expect(created.status).toBe('created')
    if (created.status === 'created') {
      expect(created.profile).toMatchObject({
        name: 'Acme Dev',
        kind: 'cloud-linked',
        cloud: expect.objectContaining({
          activeOrgId: 'dev-acme',
          activeOrgName: 'Acme Dev'
        })
      })
    }
  })

  it('signs out locally without calling the cloud logout endpoint', async () => {
    await connectCurrentFABRICAProfile(userDataPath)

    const result = await signOutCurrentFABRICAProfile(userDataPath)

    expect(result.status).toBe('signed-out')
    expect(revokeFABRICACloudSessionMock).not.toHaveBeenCalled()
    expect(getCurrentFABRICAProfileAuthStatus(userDataPath)).toMatchObject({
      configured: true,
      state: 'local',
      persistence: 'none'
    })
  })
})
