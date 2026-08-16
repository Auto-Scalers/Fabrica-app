import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  handlers,
  appExitMock,
  appQuitMock,
  appRelaunchMock,
  relaunchAppMock,
  destroySystemTrayMock,
  createLocalFABRICAProfileMock,
  getFABRICAProfileListStateMock,
  seedNewFABRICAProfileTelemetryConsentMock,
  setActiveFABRICAProfileMock,
  transferFABRICAProfileProjectMock
} = vi.hoisted(() => ({
  handlers: new Map<string, (_event: unknown, args?: unknown) => unknown>(),
  appExitMock: vi.fn(),
  appQuitMock: vi.fn(),
  appRelaunchMock: vi.fn(),
  relaunchAppMock: vi.fn(),
  destroySystemTrayMock: vi.fn(),
  createLocalFABRICAProfileMock: vi.fn(),
  getFABRICAProfileListStateMock: vi.fn(),
  seedNewFABRICAProfileTelemetryConsentMock: vi.fn(),
  setActiveFABRICAProfileMock: vi.fn(),
  transferFABRICAProfileProjectMock: vi.fn()
}))

vi.mock('electron', () => ({
  app: {
    exit: appExitMock,
    quit: appQuitMock,
    relaunch: appRelaunchMock,
    getPath: () => '/tmp/FABRICA-user-data'
  },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (_event: unknown, args?: unknown) => unknown) => {
      handlers.set(channel, handler)
    })
  }
}))

vi.mock('../tray/system-tray', () => ({
  destroySystemTray: destroySystemTrayMock
}))

vi.mock('../app-relaunch', () => ({
  relaunchApp: relaunchAppMock
}))

vi.mock('../fabrica-profiles/profile-index-store', () => ({
  createLocalFABRICAProfile: createLocalFABRICAProfileMock,
  getFABRICAProfileListState: getFABRICAProfileListStateMock,
  seedNewFABRICAProfileTelemetryConsent: seedNewFABRICAProfileTelemetryConsentMock,
  setActiveFABRICAProfile: setActiveFABRICAProfileMock
}))

function makeStoreMock(flushPendingOrThrowAsync = vi.fn()): {
  flushPendingOrThrowAsync: typeof flushPendingOrThrowAsync
  freezeWrites: ReturnType<typeof vi.fn>
  getSettings: () => Record<string, never>
} {
  return { flushPendingOrThrowAsync, freezeWrites: vi.fn(), getSettings: () => ({}) }
}

vi.mock('../fabrica-profiles/profile-project-transfer', () => ({
  transferFABRICAProfileProject: transferFABRICAProfileProjectMock
}))

import { registerFABRICAProfileHandlers } from './fabrica-profiles'

describe('registerFABRICAProfileHandlers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    handlers.clear()
    appExitMock.mockReset()
    appQuitMock.mockReset()
    appRelaunchMock.mockReset()
    relaunchAppMock.mockReset()
    relaunchAppMock.mockImplementation(() => appRelaunchMock())
    destroySystemTrayMock.mockReset()
    createLocalFABRICAProfileMock.mockReset()
    getFABRICAProfileListStateMock.mockReset()
    seedNewFABRICAProfileTelemetryConsentMock.mockReset()
    setActiveFABRICAProfileMock.mockReset()
    transferFABRICAProfileProjectMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('registers list and create handlers', async () => {
    const listState = {
      activeProfileId: 'local-default',
      profiles: [{ id: 'local-default', name: 'Personal' }]
    }
    const createState = {
      ...listState,
      profile: { id: 'local-work', name: 'Work' }
    }
    getFABRICAProfileListStateMock.mockReturnValue(listState)
    createLocalFABRICAProfileMock.mockReturnValue(createState)

    registerFABRICAProfileHandlers(makeStoreMock() as never)

    await expect(Promise.resolve(handlers.get('FABRICAProfiles:list')?.(null))).resolves.toEqual({
      ...listState,
      multiProfileUi: false
    })
    await expect(
      Promise.resolve(handlers.get('FABRICAProfiles:createLocal')?.(null, { name: 'Work' }))
    ).resolves.toBe(createState)
    expect(createLocalFABRICAProfileMock).toHaveBeenCalledWith({ name: 'Work' })
  })

  it('reports multiProfileUi when the env flag is set', async () => {
    const previous = process.env.FABRICA_MULTI_PROFILE_UI
    process.env.FABRICA_MULTI_PROFILE_UI = '1'
    try {
      getFABRICAProfileListStateMock.mockReturnValue({
        activeProfileId: 'local-default',
        profiles: []
      })
      registerFABRICAProfileHandlers(makeStoreMock() as never)

      await expect(Promise.resolve(handlers.get('FABRICAProfiles:list')?.(null))).resolves.toEqual({
        activeProfileId: 'local-default',
        profiles: [],
        multiProfileUi: true
      })
    } finally {
      if (previous === undefined) {
        delete process.env.FABRICA_MULTI_PROFILE_UI
      } else {
        process.env.FABRICA_MULTI_PROFILE_UI = previous
      }
    }
  })

  it('marks the target profile active, flushes, and relaunches', async () => {
    const flush = vi.fn()
    const onBeforeRelaunch = vi.fn()
    getFABRICAProfileListStateMock.mockReturnValue({
      activeProfileId: 'local-default',
      profiles: []
    })
    setActiveFABRICAProfileMock.mockReturnValue({
      activeProfileId: 'local-work',
      profiles: []
    })
    registerFABRICAProfileHandlers(makeStoreMock(flush) as never, { onBeforeRelaunch })

    const resultPromise = Promise.resolve(
      handlers.get('FABRICAProfiles:switch')?.(null, { profileId: 'local-work' })
    )

    await expect(resultPromise).resolves.toEqual({ status: 'relaunching' })
    expect(setActiveFABRICAProfileMock).toHaveBeenCalledWith('local-work')
    expect(flush).toHaveBeenCalledOnce()
    expect(onBeforeRelaunch).toHaveBeenCalledOnce()
    expect(flush.mock.invocationCallOrder[0]).toBeLessThan(
      setActiveFABRICAProfileMock.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY
    )
    expect(flush).toHaveBeenCalledBefore(onBeforeRelaunch)
    expect(appRelaunchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(150)

    expect(appRelaunchMock).toHaveBeenCalledOnce()
    expect(relaunchAppMock).toHaveBeenCalledWith('profile-switch')
    // Why quit, not exit: before-quit/will-quit teardown (scrollback capture,
    // PTY kill, daemon checkpoints) must run on a profile switch.
    expect(appQuitMock).toHaveBeenCalledOnce()
    expect(appExitMock).not.toHaveBeenCalled()
  })

  it('does not mark a profile active when current profile flush fails', async () => {
    const flush = vi.fn(() => {
      throw new Error('flush_failed')
    })
    getFABRICAProfileListStateMock.mockReturnValue({
      activeProfileId: 'local-default',
      profiles: []
    })
    registerFABRICAProfileHandlers(makeStoreMock(flush) as never)

    await expect(
      Promise.resolve(handlers.get('FABRICAProfiles:switch')?.(null, { profileId: 'local-work' }))
    ).rejects.toThrow('flush_failed')

    expect(setActiveFABRICAProfileMock).not.toHaveBeenCalled()
    expect(appRelaunchMock).not.toHaveBeenCalled()
  })

  it('does not switch profiles when persistence cannot reach quiescence', async () => {
    const flush = vi.fn(() => new Promise<void>(() => {}))
    const onBeforeRelaunch = vi.fn()
    getFABRICAProfileListStateMock.mockReturnValue({
      activeProfileId: 'local-default',
      profiles: []
    })
    registerFABRICAProfileHandlers(makeStoreMock(flush) as never, { onBeforeRelaunch })

    const switchProfile = Promise.resolve(
      handlers.get('FABRICAProfiles:switch')?.(null, { profileId: 'local-work' })
    )
    const rejection = expect(switchProfile).rejects.toThrow('FABRICA_profile_persistence_timeout')
    await vi.advanceTimersByTimeAsync(20_000)
    await rejection

    expect(setActiveFABRICAProfileMock).not.toHaveBeenCalled()
    expect(appRelaunchMock).not.toHaveBeenCalled()
    expect(onBeforeRelaunch).not.toHaveBeenCalled()
  })

  it('does not relaunch when switching to the active profile', async () => {
    getFABRICAProfileListStateMock.mockReturnValue({
      activeProfileId: 'local-default',
      profiles: []
    })
    registerFABRICAProfileHandlers(makeStoreMock() as never)

    await expect(
      Promise.resolve(handlers.get('FABRICAProfiles:switch')?.(null, { profileId: 'local-default' }))
    ).resolves.toEqual({ status: 'already-active' })

    expect(setActiveFABRICAProfileMock).not.toHaveBeenCalled()
    expect(appRelaunchMock).not.toHaveBeenCalled()
  })

  it('rejects invalid profile ids', async () => {
    registerFABRICAProfileHandlers(makeStoreMock() as never)

    await expect(
      Promise.resolve(handlers.get('FABRICAProfiles:switch')?.(null, { profileId: ' ' }))
    ).rejects.toThrow('invalid_FABRICA_profile_id')
  })

  it('transfers projects between inactive profiles after flushing active state', async () => {
    const flush = vi.fn()
    const result = {
      status: 'transferred',
      mode: 'copy',
      sourceProfileId: 'personal',
      targetProfileId: 'work',
      sourceRepoId: 'repo-1',
      targetRepoId: 'repo-2',
      targetProjectId: 'repo:repo-2'
    }
    getFABRICAProfileListStateMock.mockReturnValue({
      activeProfileId: 'personal',
      profiles: []
    })
    transferFABRICAProfileProjectMock.mockReturnValue(result)
    registerFABRICAProfileHandlers(makeStoreMock(flush) as never)

    await expect(
      Promise.resolve(
        handlers.get('FABRICAProfiles:transferProject')?.(null, {
          sourceProfileId: ' personal ',
          targetProfileId: ' work ',
          repoId: ' repo-1 ',
          mode: 'copy'
        })
      )
    ).resolves.toBe(result)

    expect(flush).toHaveBeenCalledOnce()
    expect(transferFABRICAProfileProjectMock).toHaveBeenCalledWith(
      {
        sourceProfileId: 'personal',
        targetProfileId: 'work',
        repoId: 'repo-1',
        mode: 'copy'
      },
      '/tmp/FABRICA-user-data'
    )
  })

  it('moves a project out of the active profile and relaunches into the target profile', async () => {
    const flush = vi.fn()
    const onBeforeRelaunch = vi.fn()
    const result = {
      status: 'transferred',
      mode: 'move',
      sourceProfileId: 'personal',
      targetProfileId: 'work',
      sourceRepoId: 'repo-1',
      targetRepoId: 'repo-1',
      targetProjectId: 'repo:repo-1'
    }
    getFABRICAProfileListStateMock.mockReturnValue({
      activeProfileId: 'personal',
      profiles: []
    })
    transferFABRICAProfileProjectMock.mockReturnValue(result)
    registerFABRICAProfileHandlers(makeStoreMock(flush) as never, { onBeforeRelaunch })

    await expect(
      Promise.resolve(
        handlers.get('FABRICAProfiles:transferProject')?.(null, {
          sourceProfileId: 'personal',
          targetProfileId: 'work',
          repoId: 'repo-1',
          mode: 'move'
        })
      )
    ).resolves.toEqual({ ...result, willRelaunch: true })

    expect(onBeforeRelaunch).toHaveBeenCalledOnce()
    expect(flush).toHaveBeenCalledOnce()
    expect(transferFABRICAProfileProjectMock).toHaveBeenCalledWith(
      {
        sourceProfileId: 'personal',
        targetProfileId: 'work',
        repoId: 'repo-1',
        mode: 'move'
      },
      '/tmp/FABRICA-user-data'
    )
    expect(setActiveFABRICAProfileMock).toHaveBeenCalledWith('work')
    expect(appRelaunchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(150)

    expect(appRelaunchMock).toHaveBeenCalledOnce()
    expect(relaunchAppMock).toHaveBeenCalledWith('profile-transfer')
    expect(appQuitMock).toHaveBeenCalledOnce()
    expect(appExitMock).not.toHaveBeenCalled()
  })

  it('rejects transfers that would mutate the active target profile offline', async () => {
    getFABRICAProfileListStateMock.mockReturnValue({
      activeProfileId: 'work',
      profiles: []
    })
    registerFABRICAProfileHandlers(makeStoreMock() as never)

    await expect(
      Promise.resolve(
        handlers.get('FABRICAProfiles:transferProject')?.(null, {
          sourceProfileId: 'personal',
          targetProfileId: 'work',
          repoId: 'repo-1',
          mode: 'copy'
        })
      )
    ).rejects.toThrow('active_target_FABRICA_profile_transfer_requires_relaunch')

    expect(transferFABRICAProfileProjectMock).not.toHaveBeenCalled()
  })
})
