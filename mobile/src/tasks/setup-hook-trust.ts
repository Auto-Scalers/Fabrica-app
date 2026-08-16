import type { PersistedTrustedFABRICAHooks } from '../../../src/shared/types'
import type { RpcClient } from '../transport/rpc-client'

export type SetupHookTrust = {
  contentHash: string
  scriptContent: string
}

export function isSetupHookTrusted(
  trust: PersistedTrustedFABRICAHooks,
  repoId: string,
  contentHash: string
): boolean {
  const repoTrust = trust[repoId]
  return Boolean(repoTrust?.all || repoTrust?.setup?.contentHash === contentHash)
}

export function wasSetupHookPreviouslyApproved(
  trust: PersistedTrustedFABRICAHooks,
  repoId: string
): boolean {
  return Boolean(trust[repoId]?.setup?.contentHash)
}

export function trustedFABRICAHooksWithSetupApproval(args: {
  trust: PersistedTrustedFABRICAHooks
  repoId: string
  contentHash: string
  alwaysTrust: boolean
  approvedAt?: number
}): PersistedTrustedFABRICAHooks {
  const approvedAt = args.approvedAt ?? Date.now()
  const existing = args.trust[args.repoId]
  const nextRepo = args.alwaysTrust
    ? { ...existing, all: { approvedAt } }
    : { ...existing, setup: { contentHash: args.contentHash, approvedAt } }
  return { ...args.trust, [args.repoId]: nextRepo }
}

export async function persistSetupHookTrustApproval(args: {
  client: RpcClient
  trust: PersistedTrustedFABRICAHooks
  repoId: string
  contentHash: string
  alwaysTrust: boolean
}): Promise<PersistedTrustedFABRICAHooks> {
  const next = trustedFABRICAHooksWithSetupApproval(args)
  const response = await args.client.sendRequest('ui.set', { trustedFABRICAHooks: next })
  if (!response.ok) {
    throw new Error(response.error.message)
  }
  return next
}

export function normalizeSetupHookTrust(
  setupTrust: SetupHookTrust | null | undefined
): SetupHookTrust | null {
  if (!setupTrust?.contentHash || !setupTrust.scriptContent) {
    return null
  }
  return setupTrust
}
