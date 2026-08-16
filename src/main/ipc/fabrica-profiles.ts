import { app, ipcMain } from 'electron'
import type { Store } from '../persistence'
import { relaunchApp, type AppRelaunchReason } from '../app-relaunch'
import type {
  CreateLocalFABRICAProfileArgs,
  CreateLocalFABRICAProfileResult,
  CreateCloudLinkedFABRICAProfileArgs,
  CreateCloudLinkedFABRICAProfileResult,
  FindFABRICAProfileProjectsByPathArgs,
  FindFABRICAProfileProjectsByPathResult,
  FABRICAProfileListResult,
  RefreshCurrentFABRICAProfileAuthResult,
  SwitchFABRICAProfileArgs,
  SwitchFABRICAProfileResult,
  TransferFABRICAProfileProjectArgs,
  TransferFABRICAProfileProjectResult,
  ConnectCurrentFABRICAProfileResult,
  FABRICAProfileAuthStatus,
  SelectFABRICAProfileOrgArgs,
  SelectFABRICAProfileOrgResult,
  SignOutCurrentFABRICAProfileResult
} from '../../shared/fabrica-profiles'
import {
  createLocalFABRICAProfile,
  getFABRICAProfileListState,
  seedNewFABRICAProfileTelemetryConsent,
  setActiveFABRICAProfile
} from '../fabrica-profiles/profile-index-store'
import {
  cloudSessionIdentity,
  recordCloudSessionIdentityMutation
} from '../fabrica-profiles/profile-cloud-session-mutation'
import { getProfileUserDataPath } from '../fabrica-profiles/profile-storage-paths'
import { isMultiProfileUiEnabled } from '../fabrica-profiles/profile-ui-scope'
import { transferFABRICAProfileProject } from '../fabrica-profiles/profile-project-transfer'
import { findFABRICAProfileProjectsByPath } from '../fabrica-profiles/profile-project-presence'
import { flushActiveProfileBeforeFileMutation } from '../fabrica-profiles/profile-persistence-deadline'
import { normalizeExecutionHostId } from '../../shared/execution-host'
import {
  createCloudLinkedFABRICAProfile,
  connectCurrentFABRICAProfile,
  getCurrentFABRICAProfileAuthStatus,
  refreshCurrentFABRICAProfileAuth,
  selectCurrentFABRICAProfileOrg,
  signOutCurrentFABRICAProfile
} from '../fabrica-profiles/profile-cloud-service'
import { registerFABRICAProfileOrgMemberHandlers } from './fabrica-profile-org-members-handlers'

type RegisterFABRICAProfileHandlersOptions = {
  onBeforeRelaunch?: () => void | Promise<void>
  onAuthMutation?: () => void
  onBeforeSignOut?: () => void
}

function profileIdFromArgs(args: unknown): string {
  if (
    !args ||
    typeof args !== 'object' ||
    typeof (args as SwitchFABRICAProfileArgs).profileId !== 'string'
  ) {
    throw new Error('invalid_FABRICA_profile_id')
  }
  const profileId = (args as SwitchFABRICAProfileArgs).profileId.trim()
  if (!profileId) {
    throw new Error('invalid_FABRICA_profile_id')
  }
  return profileId
}

function transferProjectArgsFromUnknown(args: unknown): TransferFABRICAProfileProjectArgs {
  if (!args || typeof args !== 'object') {
    throw new Error('invalid_FABRICA_profile_project_transfer')
  }
  const candidate = args as TransferFABRICAProfileProjectArgs
  const sourceProfileId = candidate.sourceProfileId?.trim()
  const targetProfileId = candidate.targetProfileId?.trim()
  const repoId = candidate.repoId?.trim()
  const mode = candidate.mode
  if (!sourceProfileId || !targetProfileId || !repoId || (mode !== 'move' && mode !== 'copy')) {
    throw new Error('invalid_FABRICA_profile_project_transfer')
  }
  return {
    sourceProfileId,
    targetProfileId,
    repoId,
    mode
  }
}

function findProjectsByPathArgsFromUnknown(args: unknown): FindFABRICAProfileProjectsByPathArgs {
  if (!args || typeof args !== 'object') {
    throw new Error('invalid_FABRICA_profile_project_path')
  }
  const candidate = args as FindFABRICAProfileProjectsByPathArgs
  const path = typeof candidate.path === 'string' ? candidate.path.trim() : ''
  if (!path) {
    throw new Error('invalid_FABRICA_profile_project_path')
  }
  let executionHostId: FindFABRICAProfileProjectsByPathArgs['executionHostId'] = null
  if (candidate.executionHostId !== null && candidate.executionHostId !== undefined) {
    if (typeof candidate.executionHostId !== 'string') {
      throw new Error('invalid_FABRICA_profile_project_path')
    }
    executionHostId = normalizeExecutionHostId(candidate.executionHostId)
    if (!executionHostId) {
      throw new Error('invalid_FABRICA_profile_project_path')
    }
  }
  return {
    path,
    connectionId:
      typeof candidate.connectionId === 'string' ? candidate.connectionId.trim() || null : null,
    executionHostId,
    excludeProfileId:
      typeof candidate.excludeProfileId === 'string'
        ? candidate.excludeProfileId.trim() || null
        : null
  }
}

function orgIdFromUnknown(args: unknown): string {
  if (!args || typeof args !== 'object') {
    throw new Error('invalid_FABRICA_profile_org_selection')
  }
  const orgId = (args as SelectFABRICAProfileOrgArgs).orgId?.trim()
  if (!orgId) {
    throw new Error('invalid_FABRICA_profile_org_selection')
  }
  return orgId
}

function createCloudLinkedProfileArgsFromUnknown(args: unknown): CreateCloudLinkedFABRICAProfileArgs {
  if (!args || typeof args !== 'object') {
    return {}
  }
  const candidate = args as CreateCloudLinkedFABRICAProfileArgs
  const orgId = typeof candidate.orgId === 'string' ? candidate.orgId.trim() : undefined
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : undefined
  return {
    ...(orgId ? { orgId } : {}),
    ...(name ? { name } : {})
  }
}

async function runBeforeProfileRelaunch(
  onBeforeRelaunch?: () => void | Promise<void>
): Promise<void> {
  try {
    await onBeforeRelaunch?.()
  } catch (error) {
    console.warn(
      '[FABRICA-profiles] Pre-relaunch cleanup failed; continuing profile switch:',
      error instanceof Error ? error.name : typeof error
    )
  }
}

function scheduleProfileRelaunch(reason: Extract<AppRelaunchReason, `profile-${string}`>): void {
  setTimeout(() => {
    relaunchApp(reason)
    // Why: app.quit() (not app.exit) so before-quit/will-quit still run —
    // renderer scrollback capture, PTY kill, stats flush, and daemon final
    // checkpoints must not be skipped on a profile switch.
    app.quit()
  }, 150)
}

export function registerFABRICAProfileHandlers(
  store: Store,
  options: RegisterFABRICAProfileHandlersOptions = {}
): void {
  ipcMain.handle(
    'FABRICAProfiles:list',
    (): FABRICAProfileListResult => ({
      ...getFABRICAProfileListState(),
      multiProfileUi: isMultiProfileUiEnabled()
    })
  )

  ipcMain.handle(
    'FABRICAProfiles:authStatus',
    (): FABRICAProfileAuthStatus => getCurrentFABRICAProfileAuthStatus(getProfileUserDataPath())
  )

  ipcMain.handle(
    'FABRICAProfiles:createLocal',
    (_event, args?: CreateLocalFABRICAProfileArgs): CreateLocalFABRICAProfileResult => {
      const result = createLocalFABRICAProfile(args)
      seedNewFABRICAProfileTelemetryConsent(result.profile.id, store.getSettings().telemetry)
      return result
    }
  )

  ipcMain.handle(
    'FABRICAProfiles:switch',
    async (_event, args: SwitchFABRICAProfileArgs): Promise<SwitchFABRICAProfileResult> => {
      const profileId = profileIdFromArgs(args)
      const current = getFABRICAProfileListState()
      if (profileId === current.activeProfileId) {
        return { status: 'already-active' }
      }

      const activeProfile = current.profiles.find(
        (profile) => profile.id === current.activeProfileId
      )
      if (activeProfile?.cloud) {
        // Why: profile selection changes the expected identity synchronously;
        // stale refresh saves must fail even before relaunch teardown finishes.
        recordCloudSessionIdentityMutation(
          cloudSessionIdentity(activeProfile.id, activeProfile.cloud),
          getProfileUserDataPath()
        )
      }
      // Why: the current profile must be persisted before the global index
      // points startup at the target profile.
      await flushActiveProfileBeforeFileMutation(store)
      await runBeforeProfileRelaunch(options.onBeforeRelaunch)
      setActiveFABRICAProfile(profileId)

      scheduleProfileRelaunch('profile-switch')

      return { status: 'relaunching' }
    }
  )

  ipcMain.handle(
    'FABRICAProfiles:transferProject',
    async (
      _event,
      rawArgs: TransferFABRICAProfileProjectArgs
    ): Promise<TransferFABRICAProfileProjectResult> => {
      const args = transferProjectArgsFromUnknown(rawArgs)
      const current = getFABRICAProfileListState()
      if (args.targetProfileId === current.activeProfileId) {
        throw new Error('active_target_FABRICA_profile_transfer_requires_relaunch')
      }
      if (args.mode === 'move' && args.sourceProfileId === current.activeProfileId) {
        // Why: transfer before any relaunch side effect so a duplicate-target
        // or validation failure cannot strand the app in a quitting state.
        await flushActiveProfileBeforeFileMutation(store)
        const result = transferFABRICAProfileProject(args, getProfileUserDataPath())
        if (result.status === 'transferred') {
          store.freezeWrites()
          await runBeforeProfileRelaunch(options.onBeforeRelaunch)
          setActiveFABRICAProfile(args.targetProfileId)
          scheduleProfileRelaunch('profile-transfer')
          return { ...result, willRelaunch: true }
        }
        return result
      }
      await flushActiveProfileBeforeFileMutation(store)
      return transferFABRICAProfileProject(args, getProfileUserDataPath())
    }
  )

  ipcMain.handle(
    'FABRICAProfiles:findProjectProfiles',
    (_event, rawArgs: FindFABRICAProfileProjectsByPathArgs): FindFABRICAProfileProjectsByPathResult =>
      findFABRICAProfileProjectsByPath(
        findProjectsByPathArgsFromUnknown(rawArgs),
        getProfileUserDataPath()
      )
  )

  ipcMain.handle(
    'FABRICAProfiles:connectCurrent',
    async (): Promise<ConnectCurrentFABRICAProfileResult> => {
      const result = await connectCurrentFABRICAProfile(getProfileUserDataPath())
      if (result.status === 'connected') {
        options.onAuthMutation?.()
      }
      return result
    }
  )

  ipcMain.handle(
    'FABRICAProfiles:createCloudLinked',
    async (
      _event,
      rawArgs?: CreateCloudLinkedFABRICAProfileArgs
    ): Promise<CreateCloudLinkedFABRICAProfileResult> => {
      const result = await createCloudLinkedFABRICAProfile(
        getProfileUserDataPath(),
        createCloudLinkedProfileArgsFromUnknown(rawArgs)
      )
      if (result.status === 'created') {
        seedNewFABRICAProfileTelemetryConsent(result.profile.id, store.getSettings().telemetry)
        options.onAuthMutation?.()
      }
      return result
    }
  )

  ipcMain.handle(
    'FABRICAProfiles:refreshAuth',
    async (): Promise<RefreshCurrentFABRICAProfileAuthResult> => {
      const result = await refreshCurrentFABRICAProfileAuth(getProfileUserDataPath())
      if (result.status === 'refreshed') {
        options.onAuthMutation?.()
      }
      return result
    }
  )

  ipcMain.handle(
    'FABRICAProfiles:signOutCurrent',
    async (): Promise<SignOutCurrentFABRICAProfileResult> => {
      options.onBeforeSignOut?.()
      return signOutCurrentFABRICAProfile(getProfileUserDataPath())
    }
  )

  ipcMain.handle(
    'FABRICAProfiles:selectOrg',
    async (_event, rawArgs: SelectFABRICAProfileOrgArgs): Promise<SelectFABRICAProfileOrgResult> => {
      const result = await selectCurrentFABRICAProfileOrg(
        getProfileUserDataPath(),
        orgIdFromUnknown(rawArgs)
      )
      if (result.status === 'selected') {
        options.onAuthMutation?.()
      }
      return result
    }
  )

  registerFABRICAProfileOrgMemberHandlers()
}
