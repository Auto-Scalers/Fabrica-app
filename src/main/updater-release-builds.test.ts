import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()
vi.mock('electron', () => ({ net: { fetch: (...args: unknown[]) => fetchMock(...args) } }))

const { listReleaseBuilds, resolveTargetBuild } = await import('./updater-release-builds')

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: () => Promise.resolve(body)
  }
}

const release = (tag: string, extra: Record<string, unknown> = {}) => ({
  tag_name: tag,
  draft: false,
  published_at: '2026-07-28T14:00:00Z',
  html_url: `https://github.com/Auto-Scalers/Fabrica-app/releases/tag/${tag}`,
  ...extra
})

describe('listReleaseBuilds', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('separates stable from rc in the shared main repo', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([release('v1.4.160-rc.2'), release('v1.4.159'), release('v1.4.158')])
    )

    await expect(listReleaseBuilds('stable').then((b) => b.map((x) => x.version))).resolves.toEqual(
      ['1.4.159', '1.4.158']
    )

    fetchMock.mockResolvedValue(
      jsonResponse([release('v1.4.160-rc.2'), release('v1.4.159'), release('v1.4.158')])
    )
    await expect(listReleaseBuilds('rc').then((b) => b.map((x) => x.version))).resolves.toEqual([
      '1.4.160-rc.2'
    ])
  })

  it('skips drafts and unparseable tags', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        release('v1.4.159'),
        release('v1.4.158', { draft: true }),
        release('not-a-version'),
        { tag_name: 42 }
      ])
    )

    const builds = await listReleaseBuilds('stable')
    expect(builds.map((build) => build.version)).toEqual(['1.4.159'])
  })

  it('keeps a composed release title and drops one that repeats the tag', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        release('v1.4.160-rc.2', { name: '1.4.160 • 02 • RC' }),
        release('v1.4.160-rc.1', { name: 'v1.4.160-rc.1' }),
        release('v1.4.160-rc.0', { name: '   ' })
      ])
    )

    const builds = await listReleaseBuilds('rc')
    expect(builds.map((build) => build.name)).toEqual(['1.4.160 • 02 • RC', null, null])
  })

  it('surfaces a rate limit as an actionable message', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, { ok: false, status: 403 }))
    await expect(listReleaseBuilds('rc')).rejects.toThrow(/rate limit/i)
  })

  it('reports a missing repo distinctly', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, { ok: false, status: 404 }))
    await expect(listReleaseBuilds('rc')).rejects.toThrow(/No releases repository/i)
  })
})

describe('resolveTargetBuild', () => {
  it('pins a stable tag at the main repo download path', () => {
    expect(resolveTargetBuild('stable', 'v1.4.159').feedUrl).toBe(
      'https://github.com/Auto-Scalers/Fabrica-app/releases/download/v1.4.159'
    )
  })

  it('pins an rc tag at the main repo download path', () => {
    expect(resolveTargetBuild('rc', 'v1.4.160-rc.2').feedUrl).toBe(
      'https://github.com/Auto-Scalers/Fabrica-app/releases/download/v1.4.160-rc.2'
    )
  })

  it('rejects a tag that is not a version', () => {
    expect(() => resolveTargetBuild('stable', 'main')).toThrow(/not a valid release tag/)
  })
})
