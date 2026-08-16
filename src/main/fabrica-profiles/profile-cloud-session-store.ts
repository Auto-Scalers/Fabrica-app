import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { safeStorage } from 'electron'
import { writeSecureJsonFile } from '../../shared/secure-file'
import type {
  FABRICACloudCapabilities,
  FABRICACloudOrgSummary,
  FABRICACloudSessionPersistence
} from '../../shared/fabrica-profiles'
import { getFABRICAProfileDirectory } from './profile-storage-paths'
import { allowsPlaintextFABRICACloudSession } from './profile-cloud-auth-config'
import type { FABRICACloudSessionExchangeResponse } from './profile-cloud-session-exchange'
import {
  cloudSessionIdentity,
  isCloudSessionMutationCurrent,
  recordSuccessfulCloudSessionLogin,
  type CloudSessionMutationSnapshot
} from './profile-cloud-session-mutation'

export type FABRICACloudSession = {
  accessToken: string
  refreshToken: string
  expiresAt: number
  capabilities: FABRICACloudCapabilities
  organizations?: FABRICACloudOrgSummary[]
}

export type FABRICACloudSessionReadResult =
  | { status: 'found'; session: FABRICACloudSession; persistence: FABRICACloudSessionPersistence }
  | { status: 'missing'; persistence: 'none' }
  | { status: 'decrypt-failed'; persistence: 'none'; error: string }

type PersistedEncryptedSession = {
  version: 1
  format: 'electron-safe-storage-v1'
  savedAt: number
  ciphertext: string
}

type PersistedPlaintextSession = {
  version: 1
  format: 'dev-plaintext-v1'
  savedAt: number
  session: FABRICACloudSession
}

type CachedFABRICACloudSession = {
  session: FABRICACloudSession
  persistence: Exclude<FABRICACloudSessionPersistence, 'none'>
}

const memorySessions = new Map<string, CachedFABRICACloudSession>()

function sessionCacheKey(profileId: string, userDataPath: string): string {
  return `${userDataPath}\0${profileId}`
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFABRICACloudSession(value: unknown): value is FABRICACloudSession {
  if (!isObject(value) || !isObject(value.capabilities) || !isObject(value.capabilities.flags)) {
    return false
  }
  if (value.organizations !== undefined && !isFABRICACloudOrganizations(value.organizations)) {
    return false
  }
  return (
    typeof value.accessToken === 'string' &&
    value.accessToken.length > 0 &&
    typeof value.refreshToken === 'string' &&
    value.refreshToken.length > 0 &&
    typeof value.expiresAt === 'number' &&
    Number.isFinite(value.expiresAt) &&
    typeof value.capabilities.refreshedAt === 'number' &&
    Number.isFinite(value.capabilities.refreshedAt)
  )
}

function isFABRICACloudOrganizations(value: unknown): value is FABRICACloudOrgSummary[] {
  if (!Array.isArray(value)) {
    return false
  }
  return value.every((organization) => {
    if (!isObject(organization)) {
      return false
    }
    return (
      typeof organization.orgId === 'string' &&
      organization.orgId.length > 0 &&
      typeof organization.name === 'string' &&
      organization.name.length > 0 &&
      (organization.role === undefined || typeof organization.role === 'string')
    )
  })
}

export function getFABRICACloudSessionPath(profileId: string, userDataPath: string): string {
  return join(getFABRICAProfileDirectory(profileId, userDataPath), 'account-session.json.enc')
}

export function saveFABRICACloudSession(
  profileId: string,
  userDataPath: string,
  session: FABRICACloudSession
): FABRICACloudSessionPersistence {
  const cacheKey = sessionCacheKey(profileId, userDataPath)
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted: PersistedEncryptedSession = {
      version: 1,
      format: 'electron-safe-storage-v1',
      savedAt: Date.now(),
      ciphertext: safeStorage.encryptString(JSON.stringify(session)).toString('base64')
    }
    writeSecureJsonFile(getFABRICACloudSessionPath(profileId, userDataPath), encrypted)
    memorySessions.set(cacheKey, { session, persistence: 'encrypted' })
    return 'encrypted'
  }

  if (allowsPlaintextFABRICACloudSession()) {
    const plaintext: PersistedPlaintextSession = {
      version: 1,
      format: 'dev-plaintext-v1',
      savedAt: Date.now(),
      session
    }
    writeSecureJsonFile(getFABRICACloudSessionPath(profileId, userDataPath), plaintext)
    memorySessions.set(cacheKey, { session, persistence: 'dev-plaintext' })
    return 'dev-plaintext'
  }

  // Why: FABRICA account refresh tokens must not silently fall back to plaintext
  // in production. Memory-only keeps cloud features usable until restart.
  memorySessions.set(cacheKey, { session, persistence: 'memory-only' })
  return 'memory-only'
}

export function saveFABRICACloudSessionExchange(
  profileId: string,
  userDataPath: string,
  exchange: FABRICACloudSessionExchangeResponse
): FABRICACloudSessionPersistence {
  recordSuccessfulCloudSessionLogin(cloudSessionIdentity(profileId, exchange.cloud), userDataPath)
  return saveFABRICACloudSession(profileId, userDataPath, {
    accessToken: exchange.accessToken,
    refreshToken: exchange.refreshToken,
    expiresAt: exchange.expiresAt,
    organizations: exchange.organizations,
    capabilities: exchange.capabilities
  })
}

export function saveFABRICACloudSessionIfCurrent(
  profileId: string,
  userDataPath: string,
  session: FABRICACloudSession,
  snapshot: CloudSessionMutationSnapshot
): FABRICACloudSessionPersistence | null {
  // Why: the check and sync save share one main-process turn, so an async
  // refresh captured before sign-out/org-switch cannot resurrect the session.
  if (!isCloudSessionMutationCurrent(profileId, userDataPath, snapshot)) {
    return null
  }
  return saveFABRICACloudSession(profileId, userDataPath, session)
}

export function readFABRICACloudSession(
  profileId: string,
  userDataPath: string
): FABRICACloudSessionReadResult {
  const cacheKey = sessionCacheKey(profileId, userDataPath)
  const memorySession = memorySessions.get(cacheKey)
  if (memorySession) {
    return {
      status: 'found',
      session: memorySession.session,
      persistence: memorySession.persistence
    }
  }

  const path = getFABRICACloudSessionPath(profileId, userDataPath)
  if (!existsSync(path)) {
    return { status: 'missing', persistence: 'none' }
  }

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as
      | PersistedEncryptedSession
      | PersistedPlaintextSession
    if (parsed.version !== 1) {
      return { status: 'decrypt-failed', persistence: 'none', error: 'Unsupported session format.' }
    }
    if (parsed.format === 'electron-safe-storage-v1') {
      if (!safeStorage.isEncryptionAvailable()) {
        return {
          status: 'decrypt-failed',
          persistence: 'none',
          error: 'OS-backed encryption is unavailable.'
        }
      }
      const decrypted = safeStorage.decryptString(Buffer.from(parsed.ciphertext, 'base64'))
      const session = JSON.parse(decrypted) as FABRICACloudSession
      if (!isFABRICACloudSession(session)) {
        return { status: 'decrypt-failed', persistence: 'none', error: 'Invalid saved session.' }
      }
      memorySessions.set(cacheKey, { session, persistence: 'encrypted' })
      return { status: 'found', session, persistence: 'encrypted' }
    }
    if (parsed.format === 'dev-plaintext-v1' && allowsPlaintextFABRICACloudSession()) {
      if (!isFABRICACloudSession(parsed.session)) {
        return { status: 'decrypt-failed', persistence: 'none', error: 'Invalid saved session.' }
      }
      memorySessions.set(cacheKey, { session: parsed.session, persistence: 'dev-plaintext' })
      return { status: 'found', session: parsed.session, persistence: 'dev-plaintext' }
    }
    return { status: 'decrypt-failed', persistence: 'none', error: 'Unsafe session format.' }
  } catch {
    return {
      status: 'decrypt-failed',
      persistence: 'none',
      error: 'Could not decrypt saved Fabrica account session.'
    }
  }
}

export function clearFABRICACloudSession(profileId: string, userDataPath: string): void {
  memorySessions.delete(sessionCacheKey(profileId, userDataPath))
  rmSync(getFABRICACloudSessionPath(profileId, userDataPath), { force: true })
}
