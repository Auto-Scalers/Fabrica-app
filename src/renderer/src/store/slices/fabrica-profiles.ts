import type { StateCreator } from 'zustand'
import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import type {
  FABRICAProfileAuthStatus,
  FABRICAProfileSummary,
  SwitchFABRICAProfileResult,
  TransferFABRICAProfileProjectArgs,
  TransferFABRICAProfileProjectResult
} from '../../../../shared/fabrica-profiles'
import type { AppState } from '../types'
import {
  createFABRICAProfilesAuthActions,
  type FABRICAProfilesAuthActions
} from './fabrica-profiles-auth-actions'

export type FABRICAProfilesSlice = FABRICAProfilesAuthActions & {
  FABRICAProfiles: FABRICAProfileSummary[]
  activeFABRICAProfileId: string | null
  FABRICAProfileAuthStatus: FABRICAProfileAuthStatus | null
  FABRICAProfilesMultiProfileUi: boolean
  FABRICAProfilesLoading: boolean
  FABRICAProfileSwitching: boolean
  FABRICAProfileConnecting: boolean
  fetchFABRICAProfiles: () => Promise<void>
  fetchFABRICAProfileAuthStatus: () => Promise<FABRICAProfileAuthStatus | null>
  createLocalFABRICAProfile: (name?: string) => Promise<FABRICAProfileSummary | null>
  switchFABRICAProfile: (profileId: string) => Promise<SwitchFABRICAProfileResult | null>
  transferFABRICAProfileProject: (
    args: TransferFABRICAProfileProjectArgs
  ) => Promise<TransferFABRICAProfileProjectResult | null>
}

export const createFABRICAProfilesSlice: StateCreator<AppState, [], [], FABRICAProfilesSlice> = (
  set,
  get,
  api
) => ({
  FABRICAProfiles: [],
  activeFABRICAProfileId: null,
  FABRICAProfileAuthStatus: null,
  FABRICAProfilesMultiProfileUi: false,
  FABRICAProfilesLoading: false,
  FABRICAProfileSwitching: false,
  FABRICAProfileConnecting: false,

  fetchFABRICAProfiles: async () => {
    set({ FABRICAProfilesLoading: true })
    try {
      const [state, authStatus] = await Promise.all([
        window.api.FABRICAProfiles.list(),
        window.api.FABRICAProfiles.authStatus()
      ])
      set({
        activeFABRICAProfileId: state.activeProfileId,
        FABRICAProfiles: state.profiles,
        FABRICAProfilesMultiProfileUi: state.multiProfileUi,
        FABRICAProfileAuthStatus: authStatus,
        FABRICAProfilesLoading: false
      })
    } catch (err) {
      console.error('Failed to fetch Fabrica profiles:', err)
      set({ FABRICAProfilesLoading: false })
    }
  },

  fetchFABRICAProfileAuthStatus: async () => {
    try {
      const authStatus = await window.api.FABRICAProfiles.authStatus()
      set({ FABRICAProfileAuthStatus: authStatus })
      return authStatus
    } catch (err) {
      console.error('Failed to fetch Fabrica profile auth status:', err)
      return null
    }
  },

  createLocalFABRICAProfile: async (name) => {
    try {
      const state = await window.api.FABRICAProfiles.createLocal({ name })
      set({
        activeFABRICAProfileId: state.activeProfileId,
        FABRICAProfiles: state.profiles
      })
      void get().fetchFABRICAProfileAuthStatus()
      return state.profile
    } catch (err) {
      console.error('Failed to create Fabrica profile:', err)
      toast.error(
        translate('auto.store.slices.FABRICA.profiles.612f7f6861', 'Failed to create profile'),
        {
          description: err instanceof Error ? err.message : String(err)
        }
      )
      return null
    }
  },

  ...createFABRICAProfilesAuthActions(set, get, api),

  switchFABRICAProfile: async (profileId) => {
    if (!profileId || profileId === get().activeFABRICAProfileId) {
      return { status: 'already-active' }
    }
    set({ FABRICAProfileSwitching: true })
    try {
      const result = await window.api.FABRICAProfiles.switchProfile({ profileId })
      if (result?.status !== 'relaunching') {
        // Why: only a relaunch may keep the switcher locked; a stale
        // "already-active" answer would otherwise disable it forever.
        set({ FABRICAProfileSwitching: false })
      }
      return result
    } catch (err) {
      console.error('Failed to switch Fabrica profile:', err)
      set({ FABRICAProfileSwitching: false })
      toast.error(
        translate('auto.store.slices.FABRICA.profiles.7d4bc516ee', 'Failed to switch profile'),
        {
          description: err instanceof Error ? err.message : String(err)
        }
      )
      return null
    }
  },

  transferFABRICAProfileProject: async (args) => {
    try {
      const result = await window.api.FABRICAProfiles.transferProject(args)
      if (result.status === 'duplicate-target') {
        toast.error(
          translate(
            'auto.store.slices.FABRICA.profiles.f518e89aa5',
            'Project already exists in that profile'
          )
        )
      }
      if (result.status === 'transferred' && result.willRelaunch) {
        set({ FABRICAProfileSwitching: true })
      }
      return result
    } catch (err) {
      console.error('Failed to transfer Fabrica profile project:', err)
      toast.error(
        translate('auto.store.slices.FABRICA.profiles.f03ae7f27b', 'Failed to transfer project'),
        {
          description: err instanceof Error ? err.message : String(err)
        }
      )
      return null
    }
  }
})
