// @vitest-environment happy-dom

import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  fetchAuthStatus: vi.fn(),
  signOut: vi.fn(),
  state: {
    FABRICAProfileAuthStatus: {
      configured: true,
      state: 'connected',
      cloud: { displayName: 'Ada Lovelace', email: 'ada@example.com' }
    } as Record<string, unknown> | null,
    FABRICAProfileConnecting: false
  }
}))

vi.mock('@/i18n/i18n', () => ({
  translate: (_key: string, fallback: string) => fallback
}))

vi.mock('@/store', () => ({
  useAppStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      ...mocks.state,
      connectCurrentFABRICAProfile: mocks.connect,
      fetchFABRICAProfileAuthStatus: mocks.fetchAuthStatus,
      signOutCurrentFABRICAProfile: mocks.signOut
    })
}))

vi.mock('../fabrica-profiles/FABRICAProfileSignOutConfirmDialog', () => ({
  FABRICAProfileSignOutConfirmDialog: ({
    open,
    onConfirm
  }: {
    open: boolean
    onConfirm: () => void
    children?: ReactNode
  }) => (open ? <button onClick={onConfirm}>Confirm sign out</button> : null)
}))

import { FABRICAAccountSettingsPane } from './FabricaAccountSettingsPane'

describe('FABRICAAccountSettingsPane', () => {
  beforeEach(() => {
    mocks.connect.mockReset()
    mocks.fetchAuthStatus.mockReset()
    mocks.signOut.mockReset()
    mocks.signOut.mockResolvedValue({ status: 'signed-out' })
    mocks.state.FABRICAProfileAuthStatus = {
      configured: true,
      state: 'connected',
      cloud: { displayName: 'Ada Lovelace', email: 'ada@example.com' }
    }
    mocks.state.FABRICAProfileConnecting = false
  })

  afterEach(cleanup)

  it('shows the connected identity and confirms sign out', async () => {
    const user = userEvent.setup()
    render(<FABRICAAccountSettingsPane />)

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()
    expect(screen.getByText('Artifact sharing')).toBeInTheDocument()
    expect(screen.getByText('Fabrica Relay')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    await user.click(screen.getByRole('button', { name: 'Confirm sign out' }))
    expect(mocks.signOut).toHaveBeenCalledOnce()
  })

  it('offers sign in for a local profile', async () => {
    const user = userEvent.setup()
    mocks.state.FABRICAProfileAuthStatus = { configured: true, state: 'local' }
    render(<FABRICAAccountSettingsPane />)

    expect(
      screen.getByText(
        'Sign in to extend Fabrica with cloud features, including Artifacts and Fabrica Relay.'
      )
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign in to Fabrica' }))
    expect(mocks.connect).toHaveBeenCalledOnce()
  })

  it('loads account status when it is not hydrated yet', () => {
    mocks.state.FABRICAProfileAuthStatus = null
    render(<FABRICAAccountSettingsPane />)

    expect(mocks.fetchAuthStatus).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Sign in to Fabrica' })).toBeDisabled()
  })
})
