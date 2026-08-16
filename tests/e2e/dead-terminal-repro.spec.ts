/**
 * Stress test for dead-terminal reproduction (setup-split flow).
 *
 * Why @headful: the dead-terminal bug is a WebGL canvas staleness issue — after
 * wrapInSplit() reparents the existing pane's container, the WebGL canvas can
 * fail to repaint. In headless mode WebGL is NEVER active, so the DOM fallback
 * renderer is used and the bug cannot manifest. Running headful ensures real
 * WebGL contexts matching production.
 *
 * See helpers/dead-terminal.ts for the shared worktree-creation helper that
 * replicates the exact activateAndRevealWorktree + ensureWorktreeHasInitialTerminal
 * production flow.
 */

import { test, expect } from './helpers/fabrica-app'
import {
  waitForSessionReady,
  waitForActiveWorktree,
  getActiveWorktreeId,
  switchToWorktree,
  ensureTerminalVisible
} from './helpers/store'
import { waitForActiveTerminalManager, waitForPaneCount } from './helpers/terminal'
import {
  createAndActivateWorktreeWithSetup,
  removeWorktreeViaStore,
  waitForAllPanesToHaveContent,
  checkWebglState
} from './helpers/dead-terminal'

const STRESS_ITERATIONS = 5

test.describe('Dead Terminal Reproduction @headful', () => {
  const createdWorktreeIds: string[] = []

  test.beforeEach(async ({ fabricaPage }) => {
    await waitForSessionReady(fabricaPage)
    await waitForActiveWorktree(fabricaPage)
    await ensureTerminalVisible(fabricaPage)

    await fabricaPage.evaluate(async () => {
      const state = window.__store?.getState()
      if (!state) {
        return
      }
      state.updateSettings({ setupScriptLaunchMode: 'split-vertical' })
    })
  })

  test.afterEach(async ({ fabricaPage }) => {
    for (const id of createdWorktreeIds) {
      await removeWorktreeViaStore(fabricaPage, id)
    }
    createdWorktreeIds.length = 0
  })

  test('@headful setup-split flow does not produce dead terminals', async ({ fabricaPage }) => {
    test.setTimeout(120_000)
    const homeWorktreeId = await waitForActiveWorktree(fabricaPage)
    await waitForActiveTerminalManager(fabricaPage, 30_000)
    await checkWebglState(fabricaPage, 'home-initial')

    for (let i = 0; i < STRESS_ITERATIONS; i++) {
      const direction = i % 2 === 0 ? 'vertical' : 'horizontal'
      const newId = await createAndActivateWorktreeWithSetup(fabricaPage, `setup-${i}`, direction)
      createdWorktreeIds.push(newId)

      await expect.poll(async () => getActiveWorktreeId(fabricaPage), { timeout: 10_000 }).toBe(newId)
      await ensureTerminalVisible(fabricaPage)
      await waitForActiveTerminalManager(fabricaPage, 30_000)
      await waitForPaneCount(fabricaPage, 2, 15_000)
      await checkWebglState(fabricaPage, `setup-${i}`)
      await waitForAllPanesToHaveContent(fabricaPage, `setup-${i} both panes`)

      await switchToWorktree(fabricaPage, homeWorktreeId)
      await expect
        .poll(async () => getActiveWorktreeId(fabricaPage), { timeout: 10_000 })
        .toBe(homeWorktreeId)
      await removeWorktreeViaStore(fabricaPage, newId)
      createdWorktreeIds.pop()
    }
  })

  test('@headful setup-split then switch-back does not leave panes dead', async ({ fabricaPage }) => {
    test.setTimeout(120_000)
    const homeWorktreeId = await waitForActiveWorktree(fabricaPage)
    await waitForActiveTerminalManager(fabricaPage, 30_000)

    for (let i = 0; i < STRESS_ITERATIONS; i++) {
      const newId = await createAndActivateWorktreeWithSetup(
        fabricaPage,
        `switchback-${i}`,
        'vertical'
      )
      createdWorktreeIds.push(newId)

      await expect.poll(async () => getActiveWorktreeId(fabricaPage), { timeout: 10_000 }).toBe(newId)
      await ensureTerminalVisible(fabricaPage)
      await waitForActiveTerminalManager(fabricaPage, 30_000)
      await waitForPaneCount(fabricaPage, 2, 15_000)
      await waitForAllPanesToHaveContent(fabricaPage, `switchback-${i} initial`)

      await switchToWorktree(fabricaPage, homeWorktreeId)
      await expect
        .poll(async () => getActiveWorktreeId(fabricaPage), { timeout: 10_000 })
        .toBe(homeWorktreeId)
      await ensureTerminalVisible(fabricaPage)
      await waitForActiveTerminalManager(fabricaPage, 15_000)

      await switchToWorktree(fabricaPage, newId)
      await expect.poll(async () => getActiveWorktreeId(fabricaPage), { timeout: 10_000 }).toBe(newId)
      await ensureTerminalVisible(fabricaPage)
      await waitForActiveTerminalManager(fabricaPage, 15_000)
      await waitForAllPanesToHaveContent(fabricaPage, `switchback-${i} after return`)

      await switchToWorktree(fabricaPage, homeWorktreeId)
      await expect
        .poll(async () => getActiveWorktreeId(fabricaPage), { timeout: 10_000 })
        .toBe(homeWorktreeId)
      await removeWorktreeViaStore(fabricaPage, newId)
      createdWorktreeIds.pop()
    }
  })

  test('@headful rapid switching between many setup-split worktrees', async ({ fabricaPage }) => {
    test.setTimeout(120_000)
    const homeWorktreeId = await waitForActiveWorktree(fabricaPage)
    await waitForActiveTerminalManager(fabricaPage, 30_000)

    const worktreeIds = [homeWorktreeId]
    for (let i = 0; i < 4; i++) {
      const newId = await createAndActivateWorktreeWithSetup(fabricaPage, `multi-${i}`, 'vertical')
      createdWorktreeIds.push(newId)
      worktreeIds.push(newId)

      await expect.poll(async () => getActiveWorktreeId(fabricaPage), { timeout: 10_000 }).toBe(newId)
      await ensureTerminalVisible(fabricaPage)
      await waitForActiveTerminalManager(fabricaPage, 30_000)
      await waitForPaneCount(fabricaPage, 2, 15_000)
      await waitForAllPanesToHaveContent(fabricaPage, `multi-create-${i}`)
    }

    for (let round = 0; round < 3; round++) {
      for (const wId of worktreeIds) {
        await switchToWorktree(fabricaPage, wId)
        await expect.poll(async () => getActiveWorktreeId(fabricaPage), { timeout: 10_000 }).toBe(wId)
        await ensureTerminalVisible(fabricaPage)
        await waitForActiveTerminalManager(fabricaPage, 15_000)
        await waitForAllPanesToHaveContent(fabricaPage, `multi-r${round}-${wId.slice(0, 8)}`)
      }
    }
  })
})
