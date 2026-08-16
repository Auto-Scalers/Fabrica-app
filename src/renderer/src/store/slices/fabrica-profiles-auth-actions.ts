import type { StateCreator } from 'zustand'
import { toast } from 'sonner'
import { translate } from '@/i18n/i18n'
import type {
  ConnectCurrentFABRICAProfileResult,
  CreateCloudLinkedFABRICAProfileResult,
  RefreshCurrentFABRICAProfileAuthResult,
  SelectFABRICAProfileOrgResult,
  SignOutCurrentFABRICAProfileResult
} from '../../../../shared/fabrica-profiles'
import type { AppState } from '../types'

export type FABRICAProfilesAuthActions = {
  createCloudLinkedFABRICAProfile: (args: {
    orgId?: string
    name?: string
  }) => Promise<CreateCloudLinkedFABRICAProfileResult | null>
  connectCurrentFABRICAProfile: () => Promise<ConnectCurrentFABRICAProfileResult | null>
  refreshCurrentFABRICAProfileAuth: () => Promise<RefreshCurrentFABRICAProfileAuthResult | null>
  signOutCurrentFABRICAProfile: () => Promise<SignOutCurrentFABRICAProfileResult | null>
  selectFABRICAProfileOrg: (orgId: string) => Promise<SelectFABRICAProfileOrgResult | null>
}

// Why a separate module: the cloud-auth actions share the profiles slice's
// state keys but form their own cohesive surface (connect/refresh/sign-out/
// org selection), and the combined slice file exceeded the repo line budget.
export const createFABRICAProfilesAuthActions: StateCreator<
  AppState,
  [],
  [],
  FABRICAProfilesAuthActions
> = (set, get) => ({
  createCloudLinkedFABRICAProfile: async (args) => {
    try {
      const result = await window.api.FABRICAProfiles.createCloudLinked(args)
      set({
        FABRICAProfileAuthStatus: result.auth,
        ...(result.status === 'created'
          ? {
              activeFABRICAProfileId: result.activeProfileId,
              FABRICAProfiles: result.profiles
            }
          : {})
      })
      if (result.status === 'created') {
        toast.success(
          translate('auto.store.slices.FABRICA.profiles.319d7cf39b', 'Cloud profile created')
        )
      } else if (result.status === 'reconnect-required') {
        toast.error(
          translate('auto.store.slices.FABRICA.profiles.d6e764e7db', 'Reconnect this profile')
        )
      } else if (result.status === 'failed') {
        toast.error(
          translate('auto.store.slices.FABRICA.profiles.f0c9e11a6d', 'Failed to create cloud profile'),
          { description: result.error }
        )
      }
      return result
    } catch (err) {
      console.error('Failed to create Fabrica cloud profile:', err)
      toast.error(
        translate('auto.store.slices.FABRICA.profiles.f0c9e11a6d', 'Failed to create cloud profile'),
        {
          description: err instanceof Error ? err.message : String(err)
        }
      )
      return null
    }
  },

  connectCurrentFABRICAProfile: async () => {
    if (get().FABRICAProfileConnecting) {
      return null
    }
    set({ FABRICAProfileConnecting: true })
    try {
      const result = await window.api.FABRICAProfiles.connectCurrent()
      set({
        FABRICAProfileConnecting: false,
        FABRICAProfileAuthStatus: result.auth,
        ...(result.status === 'connected'
          ? {
              activeFABRICAProfileId: result.activeProfileId,
              FABRICAProfiles: result.profiles
            }
          : {})
      })
      if (result.status === 'unconfigured') {
        toast.error(
          translate(
            'auto.store.slices.FABRICA.profiles.8b8fa73174',
            'Fabrica Cloud sign-in is not configured'
          ),
          {
            description: result.auth.setupMessage
          }
        )
      } else if (result.status === 'failed') {
        toast.error(
          translate('auto.store.slices.FABRICA.profiles.33290e88ed', 'Failed to connect profile'),
          { description: result.error }
        )
      } else if (result.status === 'connected') {
        toast.success(translate('auto.store.slices.FABRICA.profiles.9fcb07a796', 'Profile connected'))
      }
      return result
    } catch (err) {
      console.error('Failed to connect Fabrica profile:', err)
      set({ FABRICAProfileConnecting: false })
      toast.error(
        translate('auto.store.slices.FABRICA.profiles.33290e88ed', 'Failed to connect profile'),
        {
          description: err instanceof Error ? err.message : String(err)
        }
      )
      return null
    }
  },

  refreshCurrentFABRICAProfileAuth: async () => {
    try {
      const result = await window.api.FABRICAProfiles.refreshAuth()
      set({
        FABRICAProfileAuthStatus: result.auth,
        ...(result.status === 'refreshed'
          ? {
              activeFABRICAProfileId: result.activeProfileId,
              FABRICAProfiles: result.profiles
            }
          : {})
      })
      if (result.status === 'reconnect-required') {
        toast.error(
          translate('auto.store.slices.FABRICA.profiles.d6e764e7db', 'Reconnect this profile')
        )
      } else if (result.status === 'failed') {
        toast.error(
          translate('auto.store.slices.FABRICA.profiles.2f6c78a039', 'Failed to refresh profile auth'),
          { description: result.error }
        )
      }
      return result
    } catch (err) {
      console.error('Failed to refresh Fabrica profile auth:', err)
      toast.error(
        translate('auto.store.slices.FABRICA.profiles.2f6c78a039', 'Failed to refresh profile auth'),
        {
          description: err instanceof Error ? err.message : String(err)
        }
      )
      return null
    }
  },

  signOutCurrentFABRICAProfile: async () => {
    try {
      const result = await window.api.FABRICAProfiles.signOutCurrent()
      set({
        activeFABRICAProfileId: result.activeProfileId,
        FABRICAProfiles: result.profiles,
        FABRICAProfileAuthStatus: result.auth
      })
      toast.success(
        translate('auto.store.slices.FABRICA.profiles.a37b5e6d37', 'Signed out of profile')
      )
      return result
    } catch (err) {
      console.error('Failed to sign out of Fabrica profile:', err)
      toast.error(translate('auto.store.slices.FABRICA.profiles.83600521e7', 'Failed to sign out'), {
        description: err instanceof Error ? err.message : String(err)
      })
      return null
    }
  },

  selectFABRICAProfileOrg: async (orgId) => {
    try {
      const result = await window.api.FABRICAProfiles.selectOrg({ orgId })
      set({
        FABRICAProfileAuthStatus: result.auth,
        ...(result.status === 'selected'
          ? {
              activeFABRICAProfileId: result.activeProfileId,
              FABRICAProfiles: result.profiles
            }
          : {})
      })
      if (result.status === 'reconnect-required') {
        toast.error(
          translate('auto.store.slices.FABRICA.profiles.d6e764e7db', 'Reconnect this profile')
        )
      } else if (result.status === 'failed') {
        toast.error(
          translate('auto.store.slices.FABRICA.profiles.76deec8f58', 'Failed to switch organization'),
          { description: result.error }
        )
      }
      return result
    } catch (err) {
      console.error('Failed to switch Fabrica profile org:', err)
      toast.error(
        translate('auto.store.slices.FABRICA.profiles.76deec8f58', 'Failed to switch organization'),
        {
          description: err instanceof Error ? err.message : String(err)
        }
      )
      return null
    }
  }
})
