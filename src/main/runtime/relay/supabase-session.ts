import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  SignInSupabaseArgs,
  SignInSupabaseResult,
  SignOutSupabaseResult,
  SupabaseAuthStatus
} from '../../../shared/supabase-auth'

// Reuses the same Supabase project as the Fabrica-web landing page so relay
// JWTs are mutually valid. Configured via environment variables (no literals):
//   SUPABASE_URL              (fallback: NEXT_PUBLIC_SUPABASE_URL)
//   SUPABASE_ANON_KEY         (fallback: NEXT_PUBLIC_SUPABASE_ANON_KEY)
// For packaged builds electron-vite bakes these into the main bundle at
// compile time. Anon key is restricted by Supabase RLS, not a secret.
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

type StorageAdapterLike = {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

// Why: supabase-js has no localStorage in the Electron main process; without
// an adapter sessions die with the process. Persist to userData as plain JSON
// (the anon-key client only ever holds the user's own session tokens).
async function createFileStorageAdapter(): Promise<StorageAdapterLike> {
  let cache: Record<string, string> | null = null
  try {
    const { app } = await import('electron')
    const storagePath = join(app.getPath('userData'), 'supabase-auth-storage.json')
    const read = async (): Promise<Record<string, string>> => {
      if (cache) {
        return cache
      }
      try {
        cache = JSON.parse(await readFile(storagePath, 'utf8')) as Record<string, string>
      } catch {
        cache = {}
      }
      return cache
    }
    const write = async (next: Record<string, string>): Promise<void> => {
      await writeFile(storagePath, JSON.stringify(next), 'utf8')
    }
    return {
      getItem: async (key) => (await read())[key] ?? null,
      setItem: async (key, value) => {
        const next = { ...(await read()), [key]: value }
        await write(next)
      },
      removeItem: async (key) => {
        const next = { ...(await read()) }
        delete next[key]
        await write(next)
      }
    }
  } catch {
    // Not running as the Electron main process (tests, CLI): memory-only.
  }
  const memory = new Map<string, string>()
  return {
    getItem: async (key) => memory.get(key) ?? null,
    setItem: async (key, value) => {
      memory.set(key, value)
    },
    removeItem: async (key) => {
      memory.delete(key)
    }
  }
}

let clientPromise: Promise<SupabaseClient | null> | null = null

function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseAuthConfigured()) {
    return Promise.resolve(null)
  }
  if (!clientPromise) {
    clientPromise = (async () =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: await createFileStorageAdapter()
        }
      }))()
  }
  return clientPromise
}

// Returns the current Supabase session access token, or null when no Supabase
// session is present (e.g. before a Supabase sign-in exists).
export async function getSupabaseAccessToken(): Promise<string | null> {
  const supabase = await getSupabaseClient()
  if (!supabase) {
    return null
  }
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    return null
  }
  return data.session?.access_token ?? null
}

// Picks the token actually sent to the relay: prefer a Supabase access token
// when a Supabase session exists, otherwise fall back to the existing
// FABRICA Cloud relay token so legacy behavior is preserved.
export async function getRelayAuthToken(fallbackRelayToken: string): Promise<string> {
  const supabaseToken = await getSupabaseAccessToken()
  return supabaseToken ?? fallbackRelayToken
}

export async function getSupabaseAuthStatus(): Promise<SupabaseAuthStatus> {
  const configured = isSupabaseAuthConfigured()
  if (!configured) {
    return { configured: false, signedIn: false }
  }
  const supabase = await getSupabaseClient()
  if (!supabase) {
    return { configured: true, signedIn: false }
  }
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) {
    return { configured: true, signedIn: false }
  }
  return {
    configured: true,
    signedIn: true,
    email: data.session.user.email ?? undefined
  }
}

export async function signInSupabase(args?: SignInSupabaseArgs): Promise<SignInSupabaseResult> {
  const email = typeof args?.email === 'string' ? args.email.trim() : ''
  const password = typeof args?.password === 'string' ? args.password : ''
  if (!email || !password) {
    return { ok: false, error: 'Email and password are required.' }
  }
  const supabase = await getSupabaseClient()
  if (!supabase) {
    return { ok: false, error: 'Supabase auth is not configured in this build.' }
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function signOutSupabase(): Promise<SignOutSupabaseResult> {
  const supabase = await getSupabaseClient()
  if (!supabase) {
    return { ok: false, error: 'Supabase auth is not configured in this build.' }
  }
  const { error } = await supabase.auth.signOut()
  return error ? { ok: false, error: error.message } : { ok: true }
}
