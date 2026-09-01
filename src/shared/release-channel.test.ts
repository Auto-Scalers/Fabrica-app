import { describe, expect, it } from 'vitest'
import {
  getReleaseNotesUrlForVersion,
  getReleaseRepoForChannel,
  getVersionChannel,
  isChannelSupportedOnPlatform,
  isReleaseChannel,
  sortReleaseBuildsNewestFirst,
  type ReleaseBuild
} from './release-channel'

describe('release channel', () => {
  it('classifies versions by channel', () => {
    expect(getVersionChannel('1.4.160')).toBe('stable')
    expect(getVersionChannel('v1.4.160')).toBe('stable')
    expect(getVersionChannel('1.4.160-rc.3')).toBe('rc')
    expect(getVersionChannel('not-a-version')).toBeNull()
  })

  it('publishes both channels to the main repo', () => {
    expect(getReleaseRepoForChannel('stable')).toBe('Auto-Scalers/Fabrica-app')
    expect(getReleaseRepoForChannel('rc')).toBe('Auto-Scalers/Fabrica-app')
  })

  it('builds release-notes links against the main repo', () => {
    expect(getReleaseNotesUrlForVersion('1.4.160')).toBe(
      'https://github.com/Auto-Scalers/Fabrica-app/releases/tag/v1.4.160'
    )
    expect(getReleaseNotesUrlForVersion('v1.4.160-rc.3')).toBe(
      'https://github.com/Auto-Scalers/Fabrica-app/releases/tag/v1.4.160-rc.3'
    )
    expect(getReleaseNotesUrlForVersion(null)).toBe(
      'https://github.com/Auto-Scalers/Fabrica-app/releases'
    )
  })

  it('offers stable and rc on every platform', () => {
    for (const platform of ['darwin', 'linux', 'win32'] as const) {
      expect(isChannelSupportedOnPlatform('stable', platform)).toBe(true)
      expect(isChannelSupportedOnPlatform('rc', platform)).toBe(true)
    }
  })

  it('accepts only known channels', () => {
    expect(isReleaseChannel('stable')).toBe(true)
    expect(isReleaseChannel('rc')).toBe(true)
    expect(isReleaseChannel('nightly')).toBe(false)
    expect(isReleaseChannel(null)).toBe(false)
    expect(isReleaseChannel(undefined)).toBe(false)
  })

  it('sorts consecutive rc builds newest first', () => {
    const build = (version: string): ReleaseBuild => ({
      tag: `v${version}`,
      version,
      channel: 'rc',
      name: null,
      publishedAt: null,
      releaseUrl: `https://github.com/Auto-Scalers/Fabrica-app/releases/tag/v${version}`
    })
    const sorted = sortReleaseBuildsNewestFirst([
      build('1.4.160-rc.1'),
      build('1.4.160-rc.3'),
      build('1.4.160-rc.2')
    ])
    expect(sorted.map((entry) => entry.version)).toEqual([
      '1.4.160-rc.3',
      '1.4.160-rc.2',
      '1.4.160-rc.1'
    ])
  })
})
