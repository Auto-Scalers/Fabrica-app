import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { FABRICAOrgMembersRoster } from '../../shared/fabrica-profiles'
import { FABRICACloudRequestError } from './profile-cloud-client'

const {
  runWithFreshFABRICACloudSessionMock,
  listFABRICACloudOrgMembersMock,
  inviteFABRICACloudOrgMemberMock,
  revokeFABRICACloudOrgInviteMock,
  changeFABRICACloudOrgMemberRoleMock,
  removeFABRICACloudOrgMemberMock
} = vi.hoisted(() => ({
  runWithFreshFABRICACloudSessionMock: vi.fn(),
  listFABRICACloudOrgMembersMock: vi.fn(),
  inviteFABRICACloudOrgMemberMock: vi.fn(),
  revokeFABRICACloudOrgInviteMock: vi.fn(),
  changeFABRICACloudOrgMemberRoleMock: vi.fn(),
  removeFABRICACloudOrgMemberMock: vi.fn()
}))

let userDataPath = ''

vi.mock('electron', () => ({
  app: { getPath: () => userDataPath }
}))

vi.mock('./profile-cloud-session-refresh', () => ({
  runWithFreshFABRICACloudSessionMock,
  runWithFreshFABRICACloudSession: runWithFreshFABRICACloudSessionMock
}))

vi.mock('./profile-cloud-org-members-client', () => ({
  listFABRICACloudOrgMembers: listFABRICACloudOrgMembersMock,
  inviteFABRICACloudOrgMember: inviteFABRICACloudOrgMemberMock,
  revokeFABRICACloudOrgInvite: revokeFABRICACloudOrgInviteMock,
  changeFABRICACloudOrgMemberRole: changeFABRICACloudOrgMemberRoleMock,
  removeFABRICACloudOrgMember: removeFABRICACloudOrgMemberMock
}))

import {
  changeFABRICAProfileOrgMemberRole,
  inviteFABRICAProfileOrgMember,
  listFABRICAProfileOrgMembers,
  removeFABRICAProfileOrgMember,
  revokeFABRICAProfileOrgInvite
} from './profile-cloud-org-members-service'

const fakeSession = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: Date.now() + 3_600_000,
  capabilities: { flags: {}, refreshedAt: 1 }
}

// Why: mirror the real contract — invoke the operation with a live session and
// surface its resolved value; business 4xx are returned by the operation as
// values, never thrown, so the session layer never sees them.
function runOperationDirectly(): void {
  runWithFreshFABRICACloudSessionMock.mockImplementation(
    async (
      _config: unknown,
      _active: unknown,
      _path: unknown,
      op: (session: unknown) => unknown
    ) => ({
      status: 'ok',
      value: await op(fakeSession)
    })
  )
}

function configureCloudEnv(): void {
  vi.stubEnv('FABRICA_CLOUD_API_URL', 'https://FABRICA-cloud.example')
  vi.stubEnv('FABRICA_CLOUD_CLIENT_ID', 'desktop-client')
}

const roster: FABRICAOrgMembersRoster = {
  members: [{ userId: 'user-1', email: 'nina@example.com', role: 'owner' }],
  pendingInvites: [],
  viewerRole: 'owner',
  canManageMembers: true
}

describe('FABRICA cloud org members service (configured)', () => {
  beforeEach(() => {
    userDataPath = mkdtempSync(join(tmpdir(), 'FABRICA-org-members-'))
    runWithFreshFABRICACloudSessionMock.mockReset()
    listFABRICACloudOrgMembersMock.mockReset()
    inviteFABRICACloudOrgMemberMock.mockReset()
    revokeFABRICACloudOrgInviteMock.mockReset()
    changeFABRICACloudOrgMemberRoleMock.mockReset()
    removeFABRICACloudOrgMemberMock.mockReset()
    vi.unstubAllEnvs()
    vi.stubEnv('FABRICA_CLOUD_DEV_AUTH', '')
    vi.stubEnv('FABRICA_CLOUD_API_URL', '')
    vi.stubEnv('FABRICA_CLOUD_CLIENT_ID', '')
  })

  afterEach(() => {
    rmSync(userDataPath, { recursive: true, force: true })
    vi.unstubAllEnvs()
  })

  it('reports unconfigured when cloud sign-in is not set up', async () => {
    await expect(listFABRICAProfileOrgMembers(userDataPath, 'org-1')).resolves.toEqual({
      status: 'unconfigured'
    })
    expect(runWithFreshFABRICACloudSessionMock).not.toHaveBeenCalled()
  })

  it('returns the roster from the client', async () => {
    configureCloudEnv()
    runOperationDirectly()
    listFABRICACloudOrgMembersMock.mockResolvedValue(roster)

    await expect(listFABRICAProfileOrgMembers(userDataPath, 'org-1')).resolves.toEqual({
      status: 'ok',
      roster
    })
    expect(listFABRICACloudOrgMembersMock).toHaveBeenCalledWith(
      expect.any(Object),
      fakeSession,
      'org-1'
    )
  })

  it('maps a 409 already_member invite conflict', async () => {
    configureCloudEnv()
    runOperationDirectly()
    inviteFABRICACloudOrgMemberMock.mockRejectedValue(new FABRICACloudRequestError(409, 'already_member'))

    await expect(
      inviteFABRICAProfileOrgMember(userDataPath, { orgId: 'org-1', email: 'a@b.com', role: 'member' })
    ).resolves.toEqual({ status: 'conflict', reason: 'already_member' })
  })

  it('maps a 403 role change to forbidden', async () => {
    configureCloudEnv()
    runOperationDirectly()
    changeFABRICACloudOrgMemberRoleMock.mockRejectedValue(new FABRICACloudRequestError(403))

    await expect(
      changeFABRICAProfileOrgMemberRole(userDataPath, {
        orgId: 'org-1',
        userId: 'user-2',
        role: 'admin'
      })
    ).resolves.toEqual({ status: 'forbidden' })
  })

  it('maps a 400 cannot_remove_self to an invalid result', async () => {
    configureCloudEnv()
    runOperationDirectly()
    removeFABRICACloudOrgMemberMock.mockRejectedValue(
      new FABRICACloudRequestError(400, 'cannot_remove_self')
    )

    await expect(
      removeFABRICAProfileOrgMember(userDataPath, { orgId: 'org-1', userId: 'user-1' })
    ).resolves.toEqual({ status: 'invalid', reason: 'cannot_remove_self' })
  })

  it('maps a 404 revoke to not-found', async () => {
    configureCloudEnv()
    runOperationDirectly()
    revokeFABRICACloudOrgInviteMock.mockRejectedValue(new FABRICACloudRequestError(404))

    await expect(
      revokeFABRICAProfileOrgInvite(userDataPath, { orgId: 'org-1', email: 'gone@b.com' })
    ).resolves.toEqual({ status: 'not-found' })
  })

  it('reports reconnect-required when the session layer cannot refresh', async () => {
    configureCloudEnv()
    runWithFreshFABRICACloudSessionMock.mockResolvedValue({ status: 'reconnect-required' })

    await expect(listFABRICAProfileOrgMembers(userDataPath, 'org-1')).resolves.toEqual({
      status: 'reconnect-required'
    })
  })
})

describe('FABRICA cloud org members service (dev auth)', () => {
  beforeEach(() => {
    userDataPath = mkdtempSync(join(tmpdir(), 'FABRICA-org-members-dev-'))
    runWithFreshFABRICACloudSessionMock.mockReset()
    vi.unstubAllEnvs()
    vi.stubEnv('FABRICA_CLOUD_DEV_AUTH', '1')
  })

  afterEach(() => {
    rmSync(userDataPath, { recursive: true, force: true })
    vi.unstubAllEnvs()
  })

  it('serves an in-memory roster the caller can manage', async () => {
    const result = await listFABRICAProfileOrgMembers(userDataPath, 'dev-list-org')
    if (result.status !== 'ok') {
      throw new Error(`Expected ok, got ${result.status}`)
    }
    expect(result.roster.canManageMembers).toBe(true)
    expect(result.roster.viewerRole).toBe('owner')
    expect(result.roster.members[0]).toMatchObject({ role: 'owner' })
    expect(result.roster.members.some((member) => member.userId === null)).toBe(true)
    expect(result.roster.pendingInvites.length).toBeGreaterThan(0)
    expect(runWithFreshFABRICACloudSessionMock).not.toHaveBeenCalled()
  })

  it('mutates the dev roster across invite and revoke', async () => {
    const orgId = 'dev-mutate-org'
    await expect(
      inviteFABRICAProfileOrgMember(userDataPath, {
        orgId,
        email: 'fresh@FABRICA.local',
        role: 'member'
      })
    ).resolves.toEqual({ status: 'ok' })

    const afterInvite = await listFABRICAProfileOrgMembers(userDataPath, orgId)
    if (afterInvite.status !== 'ok') {
      throw new Error('expected ok')
    }
    expect(afterInvite.roster.pendingInvites.some((i) => i.email === 'fresh@FABRICA.local')).toBe(true)

    await expect(
      inviteFABRICAProfileOrgMember(userDataPath, {
        orgId,
        email: 'fresh@FABRICA.local',
        role: 'member'
      })
    ).resolves.toEqual({ status: 'conflict', reason: 'already_invited' })

    await expect(
      revokeFABRICAProfileOrgInvite(userDataPath, { orgId, email: 'fresh@FABRICA.local' })
    ).resolves.toEqual({ status: 'ok' })
    await expect(
      revokeFABRICAProfileOrgInvite(userDataPath, { orgId, email: 'fresh@FABRICA.local' })
    ).resolves.toEqual({ status: 'not-found' })
  })

  it('blocks changing the dev owner (self) role', async () => {
    const orgId = 'dev-self-org'
    const list = await listFABRICAProfileOrgMembers(userDataPath, orgId)
    if (list.status !== 'ok') {
      throw new Error('expected ok')
    }
    const self = list.roster.members.find((member) => member.role === 'owner')
    await expect(
      changeFABRICAProfileOrgMemberRole(userDataPath, {
        orgId,
        userId: self?.userId ?? 'dev-user',
        role: 'member'
      })
    ).resolves.toEqual({ status: 'invalid', reason: 'cannot_change_own_role' })
  })
})
