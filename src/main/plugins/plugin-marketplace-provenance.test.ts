import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  OFFICIAL_MARKETPLACE_OWNER,
  OFFICIAL_MARKETPLACE_REPOSITORY,
  isOfficialMarketplaceGitSource,
  pluginMarketplaceSchema
} from '../../shared/plugins/plugin-marketplace'
import { validateMarketplaceProvenance } from './plugin-marketplace-provenance'
import type { PluginMarketplaceRegisteredSource } from './plugin-marketplace-store'

// Locates the committed marketplace index in the sibling Fabrica-plugins repo so
// this test fails if the index ever drifts from what the app's provenance rules
// accept. Walking up from this file keeps the assertion independent of cwd.
function resolveCommittedMarketplace(): string {
  let directory = __dirname
  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = resolve(directory, 'Fabrica-plugins', 'fabrica-marketplace.json')
    try {
      readFileSync(candidate, 'utf8')
      return candidate
    } catch {
      directory = resolve(directory, '..')
    }
  }
  throw new Error('could not locate the committed fabrica-marketplace.json')
}

function officialMarketplaceSource(): PluginMarketplaceRegisteredSource {
  return {
    id: '0'.repeat(32),
    source: {
      kind: 'git',
      url: `https://github.com/${OFFICIAL_MARKETPLACE_OWNER}/${OFFICIAL_MARKETPLACE_REPOSITORY}.git`,
      ref: 'main'
    },
    addedAt: 0
  }
}

describe('committed marketplace provenance', () => {
  const marketplace = pluginMarketplaceSchema.parse(
    JSON.parse(readFileSync(resolveCommittedMarketplace(), 'utf8'))
  )

  it('is owned by the canonical official marketplace organization', () => {
    expect(marketplace.owner.toLowerCase()).toBe(OFFICIAL_MARKETPLACE_OWNER)
  })

  it('passes validateMarketplaceProvenance against the official source', () => {
    const source = officialMarketplaceSource()
    expect(isOfficialMarketplaceGitSource(source.source.url)).toBe(true)
    expect(() =>
      validateMarketplaceProvenance(source, { marketplaceCommit: '0'.repeat(40), marketplace })
    ).not.toThrow()
  })
})
