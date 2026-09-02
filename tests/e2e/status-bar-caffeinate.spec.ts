import { randomUUID } from 'node:crypto'
import type { ElectronApplication } from '@playwright/test'
import { test, expect } from './helpers/fabrica-app'
import { waitForSessionReady } from './helpers/store'
import { readHookEndpoint } from './helpers/agent-hook-endpoint'

async function postCodexHookEvent(
  electronApp: ElectronApplication,
  paneKey: string,
  eventName: 'UserPromptSubmit' | 'Stop'
): Promise<void> {
  const endpoint = await readHookEndpoint(electronApp)
  const response = await fetch(`http://127.0.0.1:${endpoint.port}/hook/codex`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-FABRICA-Agent-Hook-Token': endpoint.token
    },
    body: JSON.stringify({
      paneKey,
      tabId: 'e2e-caffeinate-tab',
      worktreeId: 'e2e-caffeinate-worktree',
      env: endpoint.env,
      version: endpoint.version,
      payload: { hook_event_name: eventName, prompt: 'e2e caffeinate prompt' }
    })
  })
  expect(response.status).toBe(204)
}

test('shows Caffeinate mode and Auto activity in the status bar', async ({
  electronApp,
  fabricaPage
}) => {
  await waitForSessionReady(fabricaPage)

  const offStatus = fabricaPage.getByRole('button', { name: 'Caffeinate, Off · Inactive' })
  await expect(offStatus).toBeVisible()
  await expect(offStatus).toHaveText('Off')
  await offStatus.click()
  await expect(fabricaPage.getByRole('menuitemradio', { name: /^On/ })).toBeVisible()
  await expect(fabricaPage.getByRole('menuitemradio', { name: /^Auto/ })).toBeVisible()
  await expect(fabricaPage.getByRole('menuitemradio', { name: /^Off/ })).toBeVisible()
  const menuProofPath = process.env.FABRICA_CAFFEINATE_MENU_PROOF_PATH
  if (menuProofPath) {
    await fabricaPage.screenshot({ path: menuProofPath })
  }
  await fabricaPage.getByRole('menuitemradio', { name: /^Auto/ }).click()

  const autoInactiveStatus = fabricaPage.getByRole('button', {
    name: 'Caffeinate, Auto · Inactive'
  })
  await expect(autoInactiveStatus).toBeVisible()

  const paneKey = `e2e-caffeinate-tab:${randomUUID()}`
  await postCodexHookEvent(electronApp, paneKey, 'UserPromptSubmit')
  const autoActiveStatus = fabricaPage.getByRole('button', {
    name: 'Caffeinate, Auto · Active'
  })
  await expect(autoActiveStatus).toBeVisible()
  await expect(autoActiveStatus).toHaveText('Auto')

  const proofPath = process.env.FABRICA_CAFFEINATE_PROOF_PATH
  if (proofPath) {
    await fabricaPage.screenshot({ path: proofPath })
  }

  await postCodexHookEvent(electronApp, paneKey, 'Stop')
  await expect(autoInactiveStatus).toBeVisible()
})
