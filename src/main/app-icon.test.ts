import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  browserWindowGetAllWindowsMock,
  createFromPathMock,
  dockSetIconMock,
  existsSyncMock,
  isMock,
  windowSetIconMock
} = vi.hoisted(() => ({
  browserWindowGetAllWindowsMock: vi.fn(),
  createFromPathMock: vi.fn(),
  dockSetIconMock: vi.fn(),
  existsSyncMock: vi.fn(() => true),
  isMock: { dev: false },
  windowSetIconMock: vi.fn()
}))

vi.mock('electron', () => ({
  app: { dock: { setIcon: dockSetIconMock } },
  BrowserWindow: { getAllWindows: browserWindowGetAllWindowsMock },
  nativeImage: { createFromPath: createFromPathMock }
}))

vi.mock('@electron-toolkit/utils', () => ({
  is: isMock
}))

vi.mock('node:fs', () => ({
  existsSync: existsSyncMock
}))

vi.mock('../../resources/app-icons/fabrica-dark.png?asset', () => ({
  default: 'dark-icon'
}))

vi.mock('../../resources/app-icons/fabrica-dark.png?asset&asarUnpack', () => ({
  default: 'dark-icon-unpacked'
}))

vi.mock('../../resources/app-icons/fabrica-light.png?asset', () => ({
  default: 'light-icon'
}))

vi.mock('../../resources/app-icons/fabrica-light.png?asset&asarUnpack', () => ({
  default: 'light-icon-unpacked'
}))

import { applyAppIcon, getAppIconPath, persistMacDockIcon } from './app-icon'

function waitForQueuedPersistence(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}

async function waitForQueuedPersistenceMicrotasks(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

function createMockChildProcess(): EventEmitter & { kill: ReturnType<typeof vi.fn> } {
  const childProcess = new EventEmitter() as EventEmitter & { kill: ReturnType<typeof vi.fn> }
  childProcess.kill = vi.fn(() => {
    childProcess.emit('exit')
    return true
  })
  return childProcess
}

describe('app icon selection', () => {
  beforeEach(() => {
    browserWindowGetAllWindowsMock.mockReset()
    createFromPathMock.mockReset()
    dockSetIconMock.mockReset()
    windowSetIconMock.mockReset()
    isMock.dev = false
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves dark, light, and invalid icon ids', () => {
    expect(getAppIconPath('dark')).toBe('dark-icon')
    expect(getAppIconPath('light')).toBe('light-icon')
    expect(getAppIconPath('missing')).toBe('light-icon')
  })

  it('applies the selected icon to the dock and live windows', () => {
    const image = { isEmpty: () => false }
    createFromPathMock.mockReturnValue(image)
    browserWindowGetAllWindowsMock.mockReturnValue([
      { isDestroyed: () => false, setIcon: windowSetIconMock },
      { isDestroyed: () => true, setIcon: vi.fn() }
    ])

    applyAppIcon('dark')

    expect(createFromPathMock).toHaveBeenCalledWith('dark-icon')
    if (process.platform === 'darwin') {
      expect(dockSetIconMock).toHaveBeenCalledWith(image)
    } else {
      expect(dockSetIconMock).not.toHaveBeenCalled()
    }
    expect(windowSetIconMock).toHaveBeenCalledWith(image)
  })

  it('persists a custom macOS dock icon to the app bundle for inactive Dock pins', async () => {
    const execFile = vi.fn(
      (
        _file: string,
        _args: string[],
        optionsCallback: unknown,
        callback?: (error: Error | null) => void
      ) => {
        const onComplete =
          typeof optionsCallback === 'function'
            ? (optionsCallback as (error: Error | null) => void)
            : callback
        onComplete?.(null)
      }
    )

    persistMacDockIcon('dark', {
      appBundlePath: '/Applications/FABRICA.app',
      execFile,
      isDevApp: false,
      platform: 'darwin'
    })
    await waitForQueuedPersistence()

    expect(execFile).toHaveBeenCalledWith(
      '/usr/bin/osascript',
      expect.arrayContaining(['-e', expect.stringContaining('setIcon:image forFile:appPath')]),
      expect.objectContaining({
        env: expect.objectContaining({
          FABRICA_APP_BUNDLE_PATH: '/Applications/FABRICA.app',
          FABRICA_APP_ICON_PATH: 'dark-icon-unpacked'
        })
      }),
      expect.any(Function)
    )
  })

  it('serializes rapid macOS dock icon persistence so the last icon request wins', async () => {
    const pendingCallbacks: (() => void)[] = []
    const execFile = vi.fn(
      (
        _file: string,
        _args: string[],
        optionsCallback: unknown,
        callback?: (error: Error | null) => void
      ) => {
        const onComplete =
          typeof optionsCallback === 'function'
            ? (optionsCallback as (error: Error | null) => void)
            : callback
        pendingCallbacks.push(() => onComplete?.(null))
      }
    )

    persistMacDockIcon('dark', {
      appBundlePath: '/Applications/FABRICA.app',
      execFile,
      isDevApp: false,
      platform: 'darwin'
    })
    await waitForQueuedPersistence()

    persistMacDockIcon('light', {
      appBundlePath: '/Applications/FABRICA.app',
      execFile,
      isDevApp: false,
      platform: 'darwin'
    })

    expect(execFile).toHaveBeenCalledTimes(1)
    expect(execFile).toHaveBeenCalledWith(
      '/usr/bin/osascript',
      expect.any(Array),
      expect.objectContaining({
        env: expect.objectContaining({
          FABRICA_APP_ICON_PATH: 'dark-icon-unpacked'
        })
      }),
      expect.any(Function)
    )

    pendingCallbacks.shift()?.()
    await waitForQueuedPersistence()

    expect(execFile).toHaveBeenCalledTimes(2)
    expect(execFile).toHaveBeenNthCalledWith(
      2,
      '/usr/bin/osascript',
      expect.any(Array),
      expect.objectContaining({
        env: expect.objectContaining({
          FABRICA_APP_ICON_PATH: 'light-icon-unpacked'
        })
      }),
      expect.any(Function)
    )

    for (const completeCommand of pendingCallbacks) {
      completeCommand()
    }
    await waitForQueuedPersistence()
  })

  it('continues macOS dock icon persistence when a command never completes', async () => {
    vi.useFakeTimers()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const hungChildProcess = createMockChildProcess()
    const execFile = vi.fn(
      (
        _file: string,
        _args: string[],
        optionsCallback: unknown,
        callback?: (error: Error | null) => void
      ) => {
        if (execFile.mock.calls.length === 1) {
          return hungChildProcess
        }
        const onComplete =
          typeof optionsCallback === 'function'
            ? (optionsCallback as (error: Error | null) => void)
            : callback
        onComplete?.(null)
        return undefined
      }
    )

    persistMacDockIcon('dark', {
      appBundlePath: '/Applications/FABRICA.app',
      execFile,
      isDevApp: false,
      platform: 'darwin'
    })
    await waitForQueuedPersistenceMicrotasks()

    persistMacDockIcon('light', {
      appBundlePath: '/Applications/FABRICA.app',
      execFile,
      isDevApp: false,
      platform: 'darwin'
    })

    expect(execFile).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(10_000)
    await waitForQueuedPersistenceMicrotasks()

    expect(hungChildProcess.kill).not.toHaveBeenCalled()
    expect(execFile).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1_000)
    await waitForQueuedPersistenceMicrotasks()

    expect(warnSpy).toHaveBeenCalledWith('[app-icon] timed out persisting macOS dock icon')
    expect(hungChildProcess.kill).toHaveBeenCalledTimes(1)
    expect(execFile).toHaveBeenCalledTimes(2)
    expect(execFile).toHaveBeenNthCalledWith(
      2,
      '/usr/bin/osascript',
      expect.any(Array),
      expect.objectContaining({
        env: expect.objectContaining({
          FABRICA_APP_ICON_PATH: 'light-icon-unpacked'
        }),
        timeout: 10_000
      }),
      expect.any(Function)
    )

    warnSpy.mockRestore()
  })
})
