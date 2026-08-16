import { expect, test } from './helpers/fabrica-app'
import { openFileExplorer } from './helpers/file-explorer'
import { pressShortcut } from './helpers/shortcuts'
import { waitForActiveWorktree, waitForSessionReady } from './helpers/store'

test('Explorer-opened Markdown accepts the find shortcut without a document click', async ({
  fabricaPage
}) => {
  await waitForSessionReady(fabricaPage)
  await waitForActiveWorktree(fabricaPage)
  await openFileExplorer(fabricaPage)

  const readmeRow = fabricaPage.locator('[data-file-explorer-row]').filter({ hasText: 'README.md' })
  await expect(readmeRow).toBeVisible({ timeout: 10_000 })
  await readmeRow.focus()
  await readmeRow.click()

  await expect(fabricaPage.locator('.rich-markdown-editor')).toBeVisible({ timeout: 25_000 })
  await pressShortcut(fabricaPage, 'f')

  await expect(
    fabricaPage.getByRole('textbox', { name: 'Find in rich markdown editor' })
  ).toBeVisible()
})
