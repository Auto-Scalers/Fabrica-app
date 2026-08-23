import { ipcMain } from 'electron'
import {
  getSupabaseAuthStatus,
  signInSupabase,
  signOutSupabase
} from '../runtime/relay/supabase-session'
import type {
  SignInSupabaseArgs,
  SignInSupabaseResult,
  SignOutSupabaseResult,
  SupabaseAuthStatus
} from '../../shared/supabase-auth'

export function registerSupabaseAuthHandlers(): void {
  ipcMain.handle(
    'supabaseAuth:getStatus',
    (): Promise<SupabaseAuthStatus> => getSupabaseAuthStatus()
  )

  ipcMain.handle(
    'supabaseAuth:signIn',
    (_event, args?: SignInSupabaseArgs): Promise<SignInSupabaseResult> => signInSupabase(args)
  )

  ipcMain.handle('supabaseAuth:signOut', (): Promise<SignOutSupabaseResult> => signOutSupabase())
}
