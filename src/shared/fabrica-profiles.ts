import { FABRICA_BROWSER_PARTITION } from './constants'
import type { ExecutionHostId } from './execution-host'

export const FABRICA_PROFILE_INDEX_SCHEMA_VERSION = 1
export const DEFAULT_LOCAL_FABRICA_PROFILE_ID = 'local-default'
export const DEFAULT_LOCAL_FABRICA_PROFILE_NAME = 'Personal'
const LEGACY_FABRICA_BROWSER_SESSION_PARTITION_PREFIX = 'persist:FABRICA-browser-session-'

export type FABRICAProfileAvatar = {
  kind: 'initials'
  initials: string
  color: 'neutral'
}

export type FABRICAProfileKind = 'local' | 'cloud-linked'

export type FABRICAProfileCloudSummary = {
  cloudProfileId: string
  userId: string
  email: string
  displayName?: string
  activeOrgId?: string
  activeOrgName?: string
  linkedAt: number
}

export type FABRICACloudOrgSummary = {
  orgId: string
  name: string
  role?: string
}

export type FABRICACloudCapabilityFlags = Record<string, boolean>

export type FABRICACloudCapabilities = {
  flags: FABRICACloudCapabilityFlags
  refreshedAt: number
}

export type FABRICACloudSessionPersistence = 'none' | 'encrypted' | 'memory-only' | 'dev-plaintext'

export type FABRICAProfileAuthState = 'local' | 'unconfigured' | 'connected' | 'reconnect-required'

export type FABRICAProfileAuthStatus = {
  activeProfileId: string
  configured: boolean
  state: FABRICAProfileAuthState
  persistence: FABRICACloudSessionPersistence
  cloud?: FABRICAProfileCloudSummary
  organizations?: FABRICACloudOrgSummary[]
  capabilities?: FABRICACloudCapabilities
  credentialError?: string
  setupMessage?: string
}

export type FABRICAProfileSummary = {
  id: string
  name: string
  avatar: FABRICAProfileAvatar
  kind: FABRICAProfileKind
  createdAt: number
  updatedAt: number
  lastOpenedAt: number
  cloud?: FABRICAProfileCloudSummary
}

export type FABRICAProfileIndex = {
  schemaVersion: number
  activeProfileId: string
  profiles: FABRICAProfileSummary[]
}

export type FABRICAProfileListState = {
  activeProfileId: string
  profiles: FABRICAProfileSummary[]
}

export type FABRICAProfileListResult = FABRICAProfileListState & {
  // Why: gates the full multi-profile switcher UI; default builds show a
  // single-profile account menu instead.
  multiProfileUi: boolean
}

export type CreateLocalFABRICAProfileArgs = {
  name?: string
}

export type CreateLocalFABRICAProfileResult = FABRICAProfileListState & {
  profile: FABRICAProfileSummary
}

export type CreateCloudLinkedFABRICAProfileArgs = {
  orgId?: string
  name?: string
}

export type SwitchFABRICAProfileArgs = {
  profileId: string
}

export type SwitchFABRICAProfileResult = {
  status: 'already-active' | 'relaunching'
}

export type TransferFABRICAProfileProjectMode = 'move' | 'copy'

export type TransferFABRICAProfileProjectArgs = {
  sourceProfileId: string
  targetProfileId: string
  repoId: string
  mode: TransferFABRICAProfileProjectMode
}

export type FindFABRICAProfileProjectsByPathArgs = {
  path: string
  connectionId?: string | null
  executionHostId?: ExecutionHostId | null
  excludeProfileId?: string | null
}

export type FABRICAProfileProjectPresence = {
  profileId: string
  profileName: string
  profileKind: FABRICAProfileKind
  repoId: string
  repoName: string
}

export type FindFABRICAProfileProjectsByPathResult = {
  projects: FABRICAProfileProjectPresence[]
}

export type TransferFABRICAProfileProjectResult =
  | {
      status: 'transferred'
      mode: TransferFABRICAProfileProjectMode
      sourceProfileId: string
      targetProfileId: string
      sourceRepoId: string
      targetRepoId: string
      targetProjectId: string | null
      willRelaunch?: boolean
    }
  | {
      status: 'duplicate-target'
      sourceProfileId: string
      targetProfileId: string
      sourceRepoId: string
      duplicateRepoId: string
    }

export type ConnectCurrentFABRICAProfileResult =
  | {
      status: 'connected'
      auth: FABRICAProfileAuthStatus
      activeProfileId: string
      profiles: FABRICAProfileSummary[]
    }
  | {
      status: 'unconfigured'
      auth: FABRICAProfileAuthStatus
    }
  | {
      status: 'cancelled'
      auth: FABRICAProfileAuthStatus
    }
  | {
      status: 'failed'
      auth: FABRICAProfileAuthStatus
      error: string
    }

export type CreateCloudLinkedFABRICAProfileResult =
  | {
      status: 'created'
      auth: FABRICAProfileAuthStatus
      activeProfileId: string
      profiles: FABRICAProfileSummary[]
      profile: FABRICAProfileSummary
    }
  | {
      status: 'unconfigured' | 'reconnect-required'
      auth: FABRICAProfileAuthStatus
    }
  | {
      status: 'failed'
      auth: FABRICAProfileAuthStatus
      error: string
    }

export type SignOutCurrentFABRICAProfileResult = {
  status: 'signed-out'
  auth: FABRICAProfileAuthStatus
  activeProfileId: string
  profiles: FABRICAProfileSummary[]
}

export type SelectFABRICAProfileOrgArgs = {
  orgId: string
}

export type SelectFABRICAProfileOrgResult =
  | {
      status: 'selected'
      auth: FABRICAProfileAuthStatus
      activeProfileId: string
      profiles: FABRICAProfileSummary[]
    }
  | {
      status: 'unconfigured' | 'reconnect-required'
      auth: FABRICAProfileAuthStatus
    }
  | {
      status: 'failed'
      auth: FABRICAProfileAuthStatus
      error: string
    }

export type RefreshCurrentFABRICAProfileAuthResult =
  | {
      status: 'refreshed'
      auth: FABRICAProfileAuthStatus
      activeProfileId: string
      profiles: FABRICAProfileSummary[]
    }
  | {
      status: 'local' | 'unconfigured' | 'reconnect-required'
      auth: FABRICAProfileAuthStatus
    }
  | {
      status: 'failed'
      auth: FABRICAProfileAuthStatus
      error: string
    }

// Why: organization roles are a fixed server-side enum; the desktop UI mirrors
// exactly these three so role selects can't drift from what the API accepts.
export type FABRICAOrgRole = 'owner' | 'admin' | 'member'

export type FABRICAOrgMember = {
  // Why: null for teammates provisioned server-side who never signed into FABRICA;
  // mutation actions are disabled for them since the API keys on a real userId.
  userId: string | null
  email: string
  displayName?: string
  role: FABRICAOrgRole
}

export type FABRICAOrgPendingInvite = {
  email: string
  role: FABRICAOrgRole
  createdAt: number
}

export type FABRICAOrgMembersRoster = {
  members: FABRICAOrgMember[]
  pendingInvites: FABRICAOrgPendingInvite[]
  viewerRole: FABRICAOrgRole
  canManageMembers: boolean
}

export type FABRICAProfileOrgMembersListArgs = {
  orgId: string
}

export type FABRICAProfileOrgMemberInviteArgs = {
  orgId: string
  email: string
  role: FABRICAOrgRole
}

export type FABRICAProfileOrgInviteRevokeArgs = {
  orgId: string
  email: string
}

export type FABRICAProfileOrgMemberChangeRoleArgs = {
  orgId: string
  userId: string
  role: FABRICAOrgRole
}

export type FABRICAProfileOrgMemberRemoveArgs = {
  orgId: string
  userId: string
}

export type FABRICAProfileOrgMembersListResult =
  | { status: 'ok'; roster: FABRICAOrgMembersRoster }
  | { status: 'unconfigured' | 'reconnect-required' }
  | { status: 'failed'; error: string }

export type FABRICAOrgInviteConflictReason = 'already_member' | 'already_invited'
export type FABRICAOrgMutationInvalidReason = 'cannot_change_own_role' | 'cannot_remove_self'

export type FABRICAProfileOrgMemberMutationResult =
  | { status: 'ok' }
  | { status: 'unconfigured' | 'reconnect-required' | 'forbidden' | 'not-found' }
  | { status: 'conflict'; reason: FABRICAOrgInviteConflictReason }
  | { status: 'invalid'; reason: FABRICAOrgMutationInvalidReason }
  | { status: 'failed'; error: string }

export function createDefaultLocalFABRICAProfile(now: number): FABRICAProfileSummary {
  return {
    id: DEFAULT_LOCAL_FABRICA_PROFILE_ID,
    name: DEFAULT_LOCAL_FABRICA_PROFILE_NAME,
    avatar: { kind: 'initials', initials: 'P', color: 'neutral' },
    kind: 'local',
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now
  }
}

function profilePartitionHash(value: string): string {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function getFABRICAProfileBrowserPartitionSegment(profileId: string): string {
  const safe = profileId.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 48) || 'profile'
  return `${safe}-${profilePartitionHash(profileId)}`
}

export function getFABRICAProfileBrowserDefaultPartition(profileId: string): string {
  if (profileId === DEFAULT_LOCAL_FABRICA_PROFILE_ID) {
    return FABRICA_BROWSER_PARTITION
  }
  return `persist:FABRICA-profile-${getFABRICAProfileBrowserPartitionSegment(profileId)}-browser-default`
}

export function getFABRICAProfileBrowserSessionPartition(
  profileId: string,
  browserSessionProfileId: string
): string {
  if (profileId === DEFAULT_LOCAL_FABRICA_PROFILE_ID) {
    return `${LEGACY_FABRICA_BROWSER_SESSION_PARTITION_PREFIX}${browserSessionProfileId}`
  }
  return `persist:FABRICA-profile-${getFABRICAProfileBrowserPartitionSegment(
    profileId
  )}-browser-session-${browserSessionProfileId}`
}
