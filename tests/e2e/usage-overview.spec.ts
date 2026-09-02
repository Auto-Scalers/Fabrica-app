import { test, expect } from './helpers/fabrica-app'
import { getStoreState, waitForSessionReady } from './helpers/store'

test.describe('usage overview', () => {
  test.beforeEach(async ({ fabricaPage }) => {
    await waitForSessionReady(fabricaPage)
  })

  test('Stats & Usage opens on the combined overview with provider controls', async ({
    fabricaPage
  }) => {
    await fabricaPage.evaluate(() => {
      const state = window.__store!.getState()
      state.openSettingsPage()
    })

    await expect
      .poll(async () => getStoreState<string>(fabricaPage, 'activeView'), { timeout: 5_000 })
      .toBe('settings')
    await fabricaPage.getByRole('button', { name: 'Stats & Usage' }).click()
    await expect(fabricaPage.getByRole('heading', { name: 'Usage Analytics' })).toBeVisible()
    const providerDropdown = fabricaPage.getByTestId('usage-provider-select')
    await expect(providerDropdown).toHaveAttribute(
      'aria-label',
      'Usage analytics provider: Overview'
    )
    await expect(fabricaPage.getByTestId('usage-overview-pane')).toBeVisible()
    await expect(fabricaPage.getByRole('heading', { name: 'Usage Overview' })).toBeVisible()
    await expect(fabricaPage.getByRole('heading', { name: 'Providers' })).toBeVisible()
    await expect(fabricaPage.getByRole('button', { name: 'Enable Claude' })).toBeVisible()
    await expect(fabricaPage.getByRole('button', { name: 'Enable Codex' })).toBeVisible()
    await expect(fabricaPage.getByRole('button', { name: 'Enable OpenCode' })).toBeVisible()

    await providerDropdown.click()
    await fabricaPage.getByRole('menuitem', { name: 'Codex', exact: true }).click()
    await expect(fabricaPage.getByRole('heading', { name: 'Codex Usage Tracking' })).toBeVisible()
    await expect(providerDropdown).toHaveAttribute('aria-label', 'Usage analytics provider: Codex')

    await providerDropdown.click()
    await fabricaPage.getByRole('menuitem', { name: 'OpenCode', exact: true }).click()
    await expect(fabricaPage.getByRole('heading', { name: 'OpenCode Usage Tracking' })).toBeVisible()
    await expect(providerDropdown).toHaveAttribute(
      'aria-label',
      'Usage analytics provider: OpenCode'
    )
  })
})
