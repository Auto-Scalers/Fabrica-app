import { test, expect } from './helpers/fabrica-app'
import {
  execInTerminal,
  getTerminalContent,
  waitForActivePanePtyId,
  waitForActiveTerminalManager
} from './helpers/terminal'
import { ensureTerminalVisible, waitForActiveWorktree, waitForSessionReady } from './helpers/store'

type CodexHomeProbe = {
  codexHome: string | null
  FABRICACodexHome: string | null
}

function readCodexHomeProbe(pageContent: string, marker: string): CodexHomeProbe | null {
  const match = new RegExp(`${marker}:(\\{[^\\r\\n]+\\})`).exec(pageContent)
  if (!match) {
    return null
  }
  return JSON.parse(match[1] ?? 'null') as CodexHomeProbe | null
}

test.describe('Terminal Codex runtime home', () => {
  test.beforeEach(async ({ fabricaPage }) => {
    await waitForSessionReady(fabricaPage)
    await waitForActiveWorktree(fabricaPage)
    await ensureTerminalVisible(fabricaPage)
  })

  test('terminal process receives the FABRICA-managed Codex home', async ({ fabricaPage }) => {
    await waitForActiveTerminalManager(fabricaPage)
    const ptyId = await waitForActivePanePtyId(fabricaPage)
    const marker = `__FABRICA_CODEX_HOME_E2E_${Date.now()}__`
    const command = [
      'node -e',
      `"console.log('${marker}:' + JSON.stringify({codexHome: process.env.CODEX_HOME || null, FABRICACodexHome: process.env.FABRICA_CODEX_HOME || null}))"`
    ].join(' ')

    await execInTerminal(fabricaPage, ptyId, command)

    let probe: CodexHomeProbe | null = null
    await expect
      .poll(
        async () => {
          probe = readCodexHomeProbe(await getTerminalContent(fabricaPage), marker)
          return Boolean(
            probe?.codexHome &&
            probe.FABRICACodexHome &&
            probe.codexHome === probe.FABRICACodexHome &&
            /[\\/]codex-runtime-home[\\/]home$/.test(probe.codexHome)
          )
        },
        { timeout: 15_000, message: 'Terminal did not expose FABRICA-managed Codex home env' }
      )
      .toBe(true)

    expect(probe?.codexHome).toBe(probe?.FABRICACodexHome)
  })
})
