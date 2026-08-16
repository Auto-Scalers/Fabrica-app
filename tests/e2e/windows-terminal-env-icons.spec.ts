import { test, expect } from './helpers/fabrica-app'
import { ensureTerminalVisible, waitForActiveWorktree, waitForSessionReady } from './helpers/store'
import {
  execInTerminal,
  waitForActivePanePtyId,
  waitForActiveTerminalManager,
  waitForTerminalOutput
} from './helpers/terminal'

test.describe('Windows terminal env and shell identity', () => {
  test.beforeEach(async ({ fabricaPage }) => {
    await waitForSessionReady(fabricaPage)
    await waitForActiveWorktree(fabricaPage)
    await ensureTerminalVisible(fabricaPage)
  })

  test('dev terminal preserves parent PATH so PATH commands resolve', async ({ fabricaPage }) => {
    await waitForActiveTerminalManager(fabricaPage)

    const ptyId = await waitForActivePanePtyId(fabricaPage)
    const marker = `__FABRICA_E2E_NODE_PATH_${Date.now()}__`

    // Why: before the dev PATH fallback, daemon-spawned PTYs could get PATH set
    // to only FABRICA's dev CLI bin. A real terminal command catches that failure.
    await execInTerminal(fabricaPage, ptyId, `node -e "console.log('${marker}')"`)

    await waitForTerminalOutput(fabricaPage, marker, 15_000)
  })

  test('Windows tab icons stay pinned to the shell used at tab creation', async ({ fabricaPage }) => {
    test.skip(process.platform !== 'win32', 'Windows shell icons only render on Windows')

    const tabIds = await fabricaPage.evaluate(() => {
      const store = window.__store
      if (!store) {
        throw new Error('Store unavailable')
      }
      const state = store.getState()
      const worktreeId = state.activeWorktreeId
      if (!worktreeId) {
        throw new Error('No active worktree')
      }

      store.setState({
        settings: { ...state.settings!, terminalWindowsShell: 'wsl.exe' }
      })
      const wslTab = store.getState().createTab(worktreeId, undefined, undefined, {
        activate: false
      })

      store.setState({
        settings: { ...store.getState().settings!, terminalWindowsShell: 'cmd.exe' }
      })
      const cmdTab = store.getState().createTab(worktreeId, undefined, undefined, {
        activate: false
      })

      return { wslTabId: wslTab.id, cmdTabId: cmdTab.id }
    })

    const tabSnapshot = await fabricaPage.evaluate(({ wslTabId, cmdTabId }) => {
      const state = window.__store!.getState()
      const tabs = Object.values(state.tabsByWorktree).flat()
      return {
        wslShell: tabs.find((tab) => tab.id === wslTabId)?.shellOverride,
        cmdShell: tabs.find((tab) => tab.id === cmdTabId)?.shellOverride
      }
    }, tabIds)

    expect(tabSnapshot).toEqual({
      wslShell: 'wsl.exe',
      cmdShell: 'cmd.exe'
    })

    const wslTab = fabricaPage.locator(
      `[data-testid="sortable-tab"][data-tab-id="${tabIds.wslTabId}"]`
    )
    const cmdTab = fabricaPage.locator(
      `[data-testid="sortable-tab"][data-tab-id="${tabIds.cmdTabId}"]`
    )
    await expect(wslTab).toBeVisible()
    await expect(cmdTab).toBeVisible()

    await expect(wslTab.locator('[data-shell-icon]')).toHaveAttribute('data-shell-icon', 'wsl.exe')
    await expect(cmdTab.locator('[data-shell-icon]')).toHaveAttribute('data-shell-icon', 'cmd.exe')
  })
})
