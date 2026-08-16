import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  handlers,
  listFABRICAProfileOrgMembersMock,
  inviteFABRICAProfileOrgMemberMock,
  revokeFABRICAProfileOrgInviteMock,
  changeFABRICAProfileOrgMemberRoleMock,
  removeFABRICAProfileOrgMemberMock
} = vi.hoisted(() => ({
  handlers: new Map<string, (_event: unknown, args?: unknown) => unknown>(),
  listFABRICAProfileOrgMembersMock: vi.fn(),
  inviteFABRICAProfileOrgMemberMock: vi.fn(),
  revokeFABRICAProfileOrgInviteMock: vi.fn(),
  changeFABRICAProfileOrgMemberRoleMock: vi.fn(),
  removeFABRICAProfileOrgMemberMock: vi.fn()
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (_event: unknown, args?: unknown) => unknown) => {
      handlers.set(channel, handler)
    })
  }
}))

vi.mock('../fabrica-profiles/profile-storage-paths', () => ({
  getProfileUserDataPath: () => '/tmp/FABRICA-user-data'
}))

vi.mock('../fabrica-profiles/profile-cloud-org-members-service', () => ({
  listFABRICAProfileOrgMembers: listFABRICAProfileOrgMembersMock,
  inviteFABRICAProfileOrgMember: inviteFABRICAProfileOrgMemberMock,
  revokeFABRICAProfileOrgInvite: revokeFABRICAProfileOrgInviteMock,
  changeFABRICAProfileOrgMemberRole: changeFABRICAProfileOrgMemberRoleMock,
  removeFABRICAProfileOrgMember: removeFABRICAProfileOrgMemberMock
}))

import { registerFABRICAProfileOrgMemberHandlers } from './fabrica-profile-org-members-handlers'

function invoke(channel: string, args?: unknown): unknown {
  const handler = handlers.get(channel)
  if (!handler) {
    throw new Error(`No handler for ${channel}`)
  }
  return handler({}, args)
}

describe('registerFABRICAProfileOrgMemberHandlers', () => {
  beforeEach(() => {
    handlers.clear()
    listFABRICAProfileOrgMembersMock.mockReset().mockResolvedValue({ status: 'ok', roster: {} })
    inviteFABRICAProfileOrgMemberMock.mockReset().mockResolvedValue({ status: 'ok' })
    revokeFABRICAProfileOrgInviteMock.mockReset().mockResolvedValue({ status: 'ok' })
    changeFABRICAProfileOrgMemberRoleMock.mockReset().mockResolvedValue({ status: 'ok' })
    removeFABRICAProfileOrgMemberMock.mockReset().mockResolvedValue({ status: 'ok' })
    registerFABRICAProfileOrgMemberHandlers()
  })

  it('registers all five org-member channels', () => {
    expect([...handlers.keys()].sort()).toEqual(
      [
        'FABRICAProfiles:orgInviteRevoke',
        'FABRICAProfiles:orgMemberChangeRole',
        'FABRICAProfiles:orgMemberInvite',
        'FABRICAProfiles:orgMemberRemove',
        'FABRICAProfiles:orgMembersList'
      ].sort()
    )
  })

  it('forwards a valid invite to the service with a trimmed email', async () => {
    await invoke('FABRICAProfiles:orgMemberInvite', {
      orgId: 'org-1',
      email: '  new@example.com  ',
      role: 'admin'
    })
    expect(inviteFABRICAProfileOrgMemberMock).toHaveBeenCalledWith('/tmp/FABRICA-user-data', {
      orgId: 'org-1',
      email: 'new@example.com',
      role: 'admin'
    })
  })

  it('rejects an invite with a missing org id', async () => {
    await expect(
      invoke('FABRICAProfiles:orgMemberInvite', { email: 'a@b.com', role: 'member' })
    ).rejects.toThrow('invalid_FABRICA_profile_org_selection')
    expect(inviteFABRICAProfileOrgMemberMock).not.toHaveBeenCalled()
  })

  it('rejects an invite with an unknown role', async () => {
    await expect(
      invoke('FABRICAProfiles:orgMemberInvite', { orgId: 'org-1', email: 'a@b.com', role: 'root' })
    ).rejects.toThrow('invalid_FABRICA_org_role')
  })

  it('rejects a role change with a blank user id', async () => {
    await expect(
      invoke('FABRICAProfiles:orgMemberChangeRole', { orgId: 'org-1', userId: '  ', role: 'admin' })
    ).rejects.toThrow('invalid_FABRICA_org_member_user')
  })

  it('forwards remove and revoke with validated args', async () => {
    await invoke('FABRICAProfiles:orgMemberRemove', { orgId: 'org-1', userId: 'user-2' })
    expect(removeFABRICAProfileOrgMemberMock).toHaveBeenCalledWith('/tmp/FABRICA-user-data', {
      orgId: 'org-1',
      userId: 'user-2'
    })
    await invoke('FABRICAProfiles:orgInviteRevoke', { orgId: 'org-1', email: 'gone@b.com' })
    expect(revokeFABRICAProfileOrgInviteMock).toHaveBeenCalledWith('/tmp/FABRICA-user-data', {
      orgId: 'org-1',
      email: 'gone@b.com'
    })
  })
})
