import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { getAppImageCliArgs, maybeRedirectAppImageCliLaunch } from './appimage-cli-redirect'

const commandNames = ['serve', 'status', 'terminal']

describe('AppImage CLI redirect', () => {
  it('detects direct AppImage CLI commands', () => {
    expect(
      getAppImageCliArgs(
        ['fabrica-linux.AppImage', 'status', '--json'],
        { APPIMAGE: '/opt/FABRICA' },
        {
          platform: 'linux',
          isPackaged: true,
          commandNames
        }
      )
    ).toEqual(['status', '--json'])
  })

  it('allows CLI global flags before the command', () => {
    expect(
      getAppImageCliArgs(
        ['fabrica-linux.AppImage', '--pairing-code', 'abc123', '--json', 'terminal', 'list'],
        {
          APPIMAGE: '/opt/FABRICA'
        },
        {
          platform: 'linux',
          isPackaged: true,
          commandNames
        }
      )
    ).toEqual(['--pairing-code', 'abc123', '--json', 'terminal', 'list'])
  })

  it('does not redirect normal desktop AppImage launches', () => {
    expect(
      getAppImageCliArgs(
        ['AppRun', '--no-sandbox', 'file:///tmp/example.txt'],
        {
          APPIMAGE: '/opt/FABRICA'
        },
        {
          platform: 'linux',
          isPackaged: true,
          commandNames
        }
      )
    ).toBeNull()
  })

  it('routes no-sandbox serve launches through the CLI', () => {
    expect(
      getAppImageCliArgs(
        ['AppRun', '--no-sandbox', 'serve', '--port', '6768'],
        { APPIMAGE: '/opt/FABRICA' },
        {
          platform: 'linux',
          isPackaged: true,
          commandNames
        }
      )
    ).toEqual(['serve', '--port', '6768'])
  })

  it('removes no-sandbox before forwarding CLI help', () => {
    expect(
      getAppImageCliArgs(
        ['AppRun', '--no-sandbox', 'serve', '--help'],
        { APPIMAGE: '/opt/FABRICA' },
        {
          platform: 'linux',
          isPackaged: true,
          commandNames
        }
      )
    ).toEqual(['serve', '--help'])
  })

  it('spawns the unpacked CLI entrypoint with Electron node mode', async () => {
    const root = await mkdtemp(join(tmpdir(), 'FABRICA-appimage-cli-redirect-'))
    const cliEntryPath = join(root, 'app.asar.unpacked', 'out', 'cli', 'index.js')
    await mkdir(join(root, 'app.asar.unpacked', 'out', 'cli'), { recursive: true })
    await writeFile(cliEntryPath, '', 'utf8')
    const spawn = vi.fn((..._args: unknown[]) => ({ status: 0 }))

    const result = maybeRedirectAppImageCliLaunch({
      argv: ['fabrica-linux.AppImage', 'status', '--json'],
      env: {
        APPIMAGE: '/opt/FABRICA/fabrica-linux.AppImage',
        NODE_OPTIONS: '--inspect',
        NODE_REPL_EXTERNAL_MODULE: '/tmp/repl.js'
      },
      platform: 'linux',
      isPackaged: true,
      resourcesPath: root,
      execPath: '/opt/FABRICA/fabrica',
      commandNames,
      spawn: spawn as never
    })

    expect(result).toEqual({ redirected: true, status: 0 })
    expect(spawn).toHaveBeenCalledWith('/opt/FABRICA/fabrica', [cliEntryPath, 'status', '--json'], {
      env: expect.objectContaining({
        APPIMAGE: '/opt/FABRICA/fabrica-linux.AppImage',
        ELECTRON_RUN_AS_NODE: '1',
        FABRICA_NODE_OPTIONS: '--inspect',
        FABRICA_NODE_REPL_EXTERNAL_MODULE: '/tmp/repl.js'
      }),
      stdio: 'inherit'
    })
    const spawnOptions = spawn.mock.calls[0]?.[2] as { env: NodeJS.ProcessEnv } | undefined
    expect(spawnOptions?.env).not.toHaveProperty('NODE_OPTIONS')
    expect(spawnOptions?.env).not.toHaveProperty('NODE_REPL_EXTERNAL_MODULE')
  })

  it('forwards an explicit no-sandbox choice to the serve child', async () => {
    const root = await mkdtemp(join(tmpdir(), 'FABRICA-appimage-cli-redirect-'))
    const cliEntryPath = join(root, 'app.asar.unpacked', 'out', 'cli', 'index.js')
    await mkdir(join(root, 'app.asar.unpacked', 'out', 'cli'), { recursive: true })
    await writeFile(cliEntryPath, '', 'utf8')
    const spawn = vi.fn((..._args: unknown[]) => ({ status: 0 }))

    maybeRedirectAppImageCliLaunch({
      argv: ['fabrica-linux.AppImage', '--no-sandbox', 'serve'],
      env: { APPIMAGE: '/opt/FABRICA/fabrica-linux.AppImage' },
      platform: 'linux',
      isPackaged: true,
      resourcesPath: root,
      execPath: '/opt/FABRICA/fabrica',
      commandNames,
      spawn: spawn as never
    })

    expect(spawn).toHaveBeenCalledWith(
      '/opt/FABRICA/fabrica',
      [cliEntryPath, 'serve'],
      expect.objectContaining({
        env: expect.objectContaining({ FABRICA_APPIMAGE_NO_SANDBOX: '1' })
      })
    )
  })
})
