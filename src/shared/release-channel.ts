import { compareAppVersions, isValidAppVersion } from './app-version'

export type ReleaseChannel = 'stable' | 'rc'

export const RELEASE_CHANNELS: readonly ReleaseChannel[] = ['stable', 'rc']

export const RELEASE_CHANNEL_LABELS: Readonly<Record<ReleaseChannel, string>> = {
  stable: 'Stable',
  rc: 'RC'
}

export const MAIN_RELEASE_REPO = 'Auto-Scalers/Fabrica-app'

const CHANNEL_RELEASE_REPOS: Record<ReleaseChannel, string> = {
  stable: MAIN_RELEASE_REPO,
  rc: MAIN_RELEASE_REPO
}

export function isReleaseChannel(value: unknown): value is ReleaseChannel {
  return typeof value === 'string' && RELEASE_CHANNELS.includes(value as ReleaseChannel)
}

export function isChannelSupportedOnPlatform(
  _channel: ReleaseChannel,
  _platform: NodeJS.Platform
): boolean {
  return true
}

export function getReleaseRepoForChannel(channel: ReleaseChannel): string {
  return CHANNEL_RELEASE_REPOS[channel]
}

export function normalizeTagToVersion(tag: string): string {
  return tag.replace(/^v/i, '')
}

export function getVersionChannel(version: string): ReleaseChannel | null {
  const normalized = normalizeTagToVersion(version)
  if (!isValidAppVersion(normalized)) {
    return null
  }
  return normalized.includes('-') ? 'rc' : 'stable'
}

/**
 * Release-notes page for a version, in whichever repo published it.
 * A null version falls back to the plain releases listing (not /releases/latest
 * — /latest also breaks when GitHub's API is degraded).
 */
export function getReleaseNotesUrlForVersion(version: string | null): string {
  const channel = version ? getVersionChannel(version) : null
  const repo = channel ? getReleaseRepoForChannel(channel) : MAIN_RELEASE_REPO
  return version
    ? `https://github.com/${repo}/releases/tag/v${normalizeTagToVersion(version)}`
    : `https://github.com/${repo}/releases`
}

export type ReleaseBuild = {
  tag: string
  version: string
  channel: ReleaseChannel
  /** The release's GitHub title. Null when it is absent or just repeats the tag,
   *  so the picker can tell "the workflow named this" from "nobody did". */
  name: string | null
  publishedAt: string | null
  releaseUrl: string
}

/** Newest first, so the picker's first row is always the channel's current tip. */
export function sortReleaseBuildsNewestFirst(builds: ReleaseBuild[]): ReleaseBuild[] {
  return [...builds].sort((left, right) => compareAppVersions(right.version, left.version))
}
