import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { isPackaged: true }
}))

import { installLinuxBareFABRICADispatcher } from './linux-bare-fabrica-dispatcher'

const created: string[] = []

async function makeFixture(): Promise<{ homePath: string; resourcesPath: string }> {
  const root = await mkdtemp(join(tmpdir(), 'fabrica-bare-dispatcher-'))
  created.push(root)
  const resourcesPath = join(root, 'resources')
  // The bundled fabrica launcher must exist for the dispatcher to be written.
  await mkdir(join(resourcesPath, 'bin'), { recursive: true })
  await writeFile(join(resourcesPath, 'bin', 'fabrica'), '#!/usr/bin/env bash\n', 'utf8')
  return { homePath: join(root, 'home'), resourcesPath }
}

afterEach(async () => {
  await Promise.all(created.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('installLinuxBareFABRICADispatcher', () => {
  it('writes an executable bare-fabrica dispatcher that execs the bundled fabrica launcher', async () => {
    const { homePath, resourcesPath } = await makeFixture()

    const result = await installLinuxBareFABRICADispatcher({
      resourcesPath,
      homePath,
      appImagePath: null
    })

    const expectedTarget = join(resourcesPath, 'bin', 'fabrica')
    expect(result.state).toBe('installed')
    expect(result.target).toBe(expectedTarget)
    expect(result.dispatcherPath).toBe(join(homePath, '.local', 'bin', 'fabrica'))

    const content = await readFile(result.dispatcherPath, 'utf8')
    expect(content).toContain('#!/usr/bin/env bash')
    // Single-quoted so a resources path with shell metacharacters can't break out.
    expect(content).toContain(`exec '${expectedTarget}' "$@"`)

    const mode = (await stat(result.dispatcherPath)).mode & 0o777
    expect(mode & 0o111).not.toBe(0)
  })

  it('is idempotent — a second install rewrites its own dispatcher without throwing', async () => {
    const { homePath, resourcesPath } = await makeFixture()

    const first = await installLinuxBareFABRICADispatcher({
      resourcesPath,
      homePath,
      appImagePath: null
    })
    const second = await installLinuxBareFABRICADispatcher({
      resourcesPath,
      homePath,
      appImagePath: null
    })

    expect(second).toEqual(first)
    expect(second.state).toBe('installed')
  })

  it('quotes a resources path containing spaces so the exec line cannot be split', async () => {
    const root = await mkdtemp(join(tmpdir(), 'fabrica-bare-dispatcher-space-'))
    created.push(root)
    const resourcesPath = join(root, 'App Support', 'resources')
    await mkdir(join(resourcesPath, 'bin'), { recursive: true })
    await writeFile(join(resourcesPath, 'bin', 'fabrica'), '#!/usr/bin/env bash\n', 'utf8')

    const result = await installLinuxBareFABRICADispatcher({
      resourcesPath,
      homePath: join(root, 'home'),
      appImagePath: null
    })

    const content = await readFile(result.dispatcherPath, 'utf8')
    expect(content).toContain(`exec '${join(resourcesPath, 'bin', 'fabrica')}' "$@"`)
  })

  it('execs the stable AppImage (not the ephemeral mount) when running from an AppImage', async () => {
    const { homePath, resourcesPath } = await makeFixture()
    const appImagePath = join(homePath, 'Applications', 'Fabrica.AppImage')

    const result = await installLinuxBareFABRICADispatcher({ resourcesPath, homePath, appImagePath })

    expect(result.state).toBe('installed')
    expect(result.target).toBe(appImagePath)
    const content = await readFile(result.dispatcherPath, 'utf8')
    // The AppImage wrapper references the stable outer path, never resourcesPath.
    expect(content).toContain(appImagePath)
    expect(content).not.toContain(resourcesPath)
  })

  it('skips (does not clobber) a user-owned fabrica already at ~/.local/bin', async () => {
    const { homePath, resourcesPath } = await makeFixture()
    const dispatcherPath = join(homePath, '.local', 'bin', 'fabrica')
    await mkdir(join(homePath, '.local', 'bin'), { recursive: true })
    await writeFile(dispatcherPath, '#!/bin/sh\necho my own fabrica\n', 'utf8')

    const result = await installLinuxBareFABRICADispatcher({
      resourcesPath,
      homePath,
      appImagePath: null
    })

    expect(result.state).toBe('skipped-foreign')
    expect(await readFile(dispatcherPath, 'utf8')).toBe('#!/bin/sh\necho my own fabrica\n')
  })

  it('skips when the bundled fabrica launcher is missing from the build', async () => {
    const root = await mkdtemp(join(tmpdir(), 'fabrica-bare-dispatcher-nolauncher-'))
    created.push(root)

    const result = await installLinuxBareFABRICADispatcher({
      resourcesPath: join(root, 'resources'),
      homePath: join(root, 'home'),
      appImagePath: null
    })

    expect(result.state).toBe('skipped-launcher-missing')
    expect(result.target).toBeNull()
  })
})
