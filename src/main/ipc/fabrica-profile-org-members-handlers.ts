import { ipcMain } from 'electron'
import type {
  FABRICAOrgRole,
  FABRICAProfileOrgInviteRevokeArgs,
  FABRICAProfileOrgMemberChangeRoleArgs,
  FABRICAProfileOrgMemberInviteArgs,
  FABRICAProfileOrgMemberMutationResult,
  FABRICAProfileOrgMemberRemoveArgs,
  FABRICAProfileOrgMembersListArgs,
  FABRICAProfileOrgMembersListResult
} from '../../shared/fabrica-profiles'
import { getProfileUserDataPath } from '../fabrica-profiles/profile-storage-paths'
import {
  changeFABRICAProfileOrgMemberRole,
  inviteFABRICAProfileOrgMember,
  listFABRICAProfileOrgMembers,
  removeFABRICAProfileOrgMember,
  revokeFABRICAProfileOrgInvite
} from '../fabrica-profiles/profile-cloud-org-members-service'

function orgMembersScopedArgs(args: unknown): { orgId: string; record: Record<string, unknown> } {
  if (!args || typeof args !== 'object') {
    throw new Error('invalid_FABRICA_profile_org_selection')
  }
  const record = args as Record<string, unknown>
  const orgId = typeof record.orgId === 'string' ? record.orgId.trim() : ''
  if (!orgId) {
    throw new Error('invalid_FABRICA_profile_org_selection')
  }
  return { orgId, record }
}

function orgRoleFromUnknown(value: unknown): FABRICAOrgRole {
  if (value === 'owner' || value === 'admin' || value === 'member') {
    return value
  }
  throw new Error('invalid_FABRICA_org_role')
}

function orgEmailFromUnknown(value: unknown): string {
  const email = typeof value === 'string' ? value.trim() : ''
  if (!email) {
    throw new Error('invalid_FABRICA_org_member_email')
  }
  return email
}

function orgUserIdFromUnknown(value: unknown): string {
  const userId = typeof value === 'string' ? value.trim() : ''
  if (!userId) {
    throw new Error('invalid_FABRICA_org_member_user')
  }
  return userId
}

function orgMemberInviteArgsFromUnknown(args: unknown): FABRICAProfileOrgMemberInviteArgs {
  const { orgId, record } = orgMembersScopedArgs(args)
  return { orgId, email: orgEmailFromUnknown(record.email), role: orgRoleFromUnknown(record.role) }
}

function orgInviteRevokeArgsFromUnknown(args: unknown): FABRICAProfileOrgInviteRevokeArgs {
  const { orgId, record } = orgMembersScopedArgs(args)
  return { orgId, email: orgEmailFromUnknown(record.email) }
}

function orgMemberChangeRoleArgsFromUnknown(args: unknown): FABRICAProfileOrgMemberChangeRoleArgs {
  const { orgId, record } = orgMembersScopedArgs(args)
  return {
    orgId,
    userId: orgUserIdFromUnknown(record.userId),
    role: orgRoleFromUnknown(record.role)
  }
}

function orgMemberRemoveArgsFromUnknown(args: unknown): FABRICAProfileOrgMemberRemoveArgs {
  const { orgId, record } = orgMembersScopedArgs(args)
  return { orgId, userId: orgUserIdFromUnknown(record.userId) }
}

export function registerFABRICAProfileOrgMemberHandlers(): void {
  ipcMain.handle(
    'FABRICAProfiles:orgMembersList',
    async (
      _event,
      rawArgs: FABRICAProfileOrgMembersListArgs
    ): Promise<FABRICAProfileOrgMembersListResult> =>
      listFABRICAProfileOrgMembers(getProfileUserDataPath(), orgMembersScopedArgs(rawArgs).orgId)
  )

  ipcMain.handle(
    'FABRICAProfiles:orgMemberInvite',
    async (
      _event,
      rawArgs: FABRICAProfileOrgMemberInviteArgs
    ): Promise<FABRICAProfileOrgMemberMutationResult> =>
      inviteFABRICAProfileOrgMember(getProfileUserDataPath(), orgMemberInviteArgsFromUnknown(rawArgs))
  )

  ipcMain.handle(
    'FABRICAProfiles:orgInviteRevoke',
    async (
      _event,
      rawArgs: FABRICAProfileOrgInviteRevokeArgs
    ): Promise<FABRICAProfileOrgMemberMutationResult> =>
      revokeFABRICAProfileOrgInvite(getProfileUserDataPath(), orgInviteRevokeArgsFromUnknown(rawArgs))
  )

  ipcMain.handle(
    'FABRICAProfiles:orgMemberChangeRole',
    async (
      _event,
      rawArgs: FABRICAProfileOrgMemberChangeRoleArgs
    ): Promise<FABRICAProfileOrgMemberMutationResult> =>
      changeFABRICAProfileOrgMemberRole(
        getProfileUserDataPath(),
        orgMemberChangeRoleArgsFromUnknown(rawArgs)
      )
  )

  ipcMain.handle(
    'FABRICAProfiles:orgMemberRemove',
    async (
      _event,
      rawArgs: FABRICAProfileOrgMemberRemoveArgs
    ): Promise<FABRICAProfileOrgMemberMutationResult> =>
      removeFABRICAProfileOrgMember(getProfileUserDataPath(), orgMemberRemoveArgsFromUnknown(rawArgs))
  )
}
