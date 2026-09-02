import { test } from './helpers/fabrica-app'
import { connectDockerSshRelayTarget } from './helpers/docker-ssh-relay-connection'
import {
  cleanupDockerSshRelayTarget,
  startDockerSshRelayTarget,
  type DockerSshRelayTarget
} from './helpers/docker-ssh-relay-target'
import {
  execInTerminal,
  waitForActivePanePtyId,
  waitForActiveTerminalManager,
  waitForTerminalOutput
} from './helpers/terminal'
import { ensureTerminalVisible, waitForActiveWorktree, waitForSessionReady } from './helpers/store'

const RUN_DOCKER_SSH = process.env.FABRICA_E2E_SSH_DOCKER === '1'

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}

function remoteOscQueryScript(runId: string): string {
  return [
    "process.stdin.setEncoding('utf8')",
    'if (process.stdin.isTTY) process.stdin.setRawMode(true)',
    'process.stdin.resume()',
    "let received = ''",
    `process.stdout.write('REMOTE_OSC_READY_${runId}\\n')`,
    "process.stdin.on('data', (chunk) => {",
    '  received += chunk',
    "  if (received.includes('\\x1b]10;rgb:')) {",
    `    process.stdout.write('REMOTE_OSC_REPLY_${runId}\\n')`,
    '    process.exit(0)',
    '  }',
    '})',
    "setTimeout(() => process.stdout.write('\\x1b]10;?\\x1b\\\\'), 100)"
  ].join(';')
}

test.describe('PTY input write queue over SSH', () => {
  test.skip(!RUN_DOCKER_SSH, 'Set FABRICA_E2E_SSH_DOCKER=1 to run Docker-backed SSH E2E.')
  test.skip(process.platform === 'win32', 'Docker SSH E2E uses POSIX ssh tooling.')

  test('returns an xterm OSC query reply through the live SSH PTY', async ({
    fabricaPage
  }, testInfo) => {
    test.slow()
    let target: DockerSshRelayTarget | null = null
    try {
      target = startDockerSshRelayTarget(testInfo)
      await waitForSessionReady(fabricaPage)
      await waitForActiveWorktree(fabricaPage)
      await connectDockerSshRelayTarget(fabricaPage, target)
      await ensureTerminalVisible(fabricaPage, 45_000)
      await waitForActiveTerminalManager(fabricaPage, 60_000)
      const ptyId = await waitForActivePanePtyId(fabricaPage, 60_000)
      const runId = String(Date.now())

      await execInTerminal(fabricaPage, ptyId, `node -e ${shellQuote(remoteOscQueryScript(runId))}`)
      await waitForTerminalOutput(fabricaPage, `REMOTE_OSC_READY_${runId}`, 30_000, 80_000)
      await waitForTerminalOutput(fabricaPage, `REMOTE_OSC_REPLY_${runId}`, 30_000, 80_000)
    } finally {
      cleanupDockerSshRelayTarget(target)
    }
  })
})
