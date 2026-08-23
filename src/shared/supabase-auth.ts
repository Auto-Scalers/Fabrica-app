export type SupabaseAuthStatus = {
  configured: boolean
  signedIn: boolean
  email?: string
}

export type SignInSupabaseArgs = {
  email: string
  password: string
}

export type SignInSupabaseResult = {
  ok: boolean
  error?: string
}

export type SignOutSupabaseResult = {
  ok: boolean
  error?: string
}
