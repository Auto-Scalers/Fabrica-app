import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  openHttpLink,
  registerHttpLinkStoreAccessor,
  resolveModifierRouting
} from './http-link-routing'

describe('resolveModifierRouting', () => {
  it('is inert without the modifier regardless of settings', () => {
    for (const openLinksInApp of [true, false]) {
      for (const inverts of [true, false]) {
        expect(resolveModifierRouting(false, openLinksInApp, inverts)).toEqual({
          wantsFABRICA: false,
          wantsSystemBrowser: false
        })
      }
    }
  })

  // Why: the setting ships off, so the historical one-way escape hatch must be
  // byte-for-byte unchanged for every existing user.
  it('always forces the system browser when inverting is off', () => {
    expect(resolveModifierRouting(true, true, false)).toEqual({
      wantsFABRICA: false,
      wantsSystemBrowser: true
    })
    expect(resolveModifierRouting(true, false, false)).toEqual({
      wantsFABRICA: false,
      wantsSystemBrowser: true
    })
  })

  it('still reaches the system browser when inverting and links open in Fabrica', () => {
    expect(resolveModifierRouting(true, true, true)).toEqual({
      wantsFABRICA: false,
      wantsSystemBrowser: true
    })
  })

  it('reaches Fabrica when inverting and links open in the system browser', () => {
    expect(resolveModifierRouting(true, false, true)).toEqual({
      wantsFABRICA: true,
      wantsSystemBrowser: false
    })
  })

  it('only diverges from the legacy behavior when links open externally', () => {
    expect(resolveModifierRouting(true, true, true)).toEqual(
      resolveModifierRouting(true, true, false)
    )
    expect(resolveModifierRouting(true, false, true)).not.toEqual(
      resolveModifierRouting(true, false, false)
    )
  })
})

describe('modifier routing across link source owners', () => {
  const openUrlMock = vi.fn()
  const setActiveWorktreeMock = vi.fn()
  const createBrowserTabMock = vi.fn()
  const storeState = {
    settings: {} as {
      openLinksInApp?: boolean
      openLinksInAppModifierInverts?: boolean
      activeRuntimeEnvironmentId?: string | null
    },
    setActiveWorktree: setActiveWorktreeMock,
    createBrowserTab: createBrowserTabMock
  }

  beforeEach(() => {
    vi.clearAllMocks()
    registerHttpLinkStoreAccessor(() => storeState)
    vi.stubGlobal('window', { api: { shell: { openUrl: openUrlMock } } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('still lets the inverting modifier pull a local link into Fabrica', () => {
    storeState.settings = { openLinksInApp: false, openLinksInAppModifierInverts: true }

    openHttpLink('https://example.com/', {
      worktreeId: 'wt-1',
      modifierHeld: true,
      sourceOwner: { kind: 'local' }
    })

    expect(createBrowserTabMock).toHaveBeenCalledWith('wt-1', 'https://example.com/', {
      activate: true
    })
  })

  it('never lets a modifier pull a runtime-owned link into Fabrica', () => {
    for (const inverts of [true, false]) {
      vi.clearAllMocks()
      storeState.settings = {
        openLinksInApp: false,
        openLinksInAppModifierInverts: inverts,
        activeRuntimeEnvironmentId: null
      }

      openHttpLink('https://example.com/', {
        worktreeId: 'wt-1',
        modifierHeld: true,
        sourceOwner: { kind: 'runtime', runtimeEnvironmentId: 'env-1' }
      })

      expect(openUrlMock).toHaveBeenCalledWith('https://example.com/')
      expect(createBrowserTabMock).not.toHaveBeenCalled()
    }
  })
})
