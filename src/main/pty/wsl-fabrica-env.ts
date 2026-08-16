import {
  ORCHESTRATION_COMPATIBILITY_ATTACHMENT_ENV,
  ORCHESTRATION_COMPATIBILITY_HOST_ID_ENV,
  ORCHESTRATION_COMPATIBILITY_HOST_INCARNATION_ENV,
  ORCHESTRATION_COMPATIBILITY_HOST_KIND_ENV
} from '../../shared/orchestration-compatibility-evidence'
import {
  SETUP_AGENT_SEQUENCE_STARTUP_COMMAND_ENV,
  SETUP_AGENT_SEQUENCE_STARTUP_SCRIPT_ENV
} from '../../shared/setup-agent-sequencing'

const WSLENV_ENTRY_SEPARATOR = ':'

function parseWslenvEntries(value: string | undefined): string[] {
  return value ? value.split(WSLENV_ENTRY_SEPARATOR).filter(Boolean) : []
}

function upsertWslenvEntry(entries: string[], entry: string): void {
  const variableName = entry.split('/')[0]
  const existingIndex = entries.findIndex((value) => value.split('/')[0] === variableName)
  if (existingIndex === -1) {
    entries.push(entry)
    return
  }
  entries[existingIndex] = entry
}

function applyWslenvPassthrough(
  env: Record<string, string | undefined>,
  passthroughEntries: string[]
): void {
  const entries = parseWslenvEntries(env.WSLENV)
  for (const entry of passthroughEntries) {
    const variableName = entry.split('/')[0]
    if (env[variableName]) {
      upsertWslenvEntry(entries, entry)
    }
  }
  env.WSLENV = entries.join(WSLENV_ENTRY_SEPARATOR)
}

function worktreeSetupWslenvEntries(env: Record<string, string | undefined>): string[] {
  return [
    // Why: worktree setup/hook scripts read these (#9206). For WSL worktrees
    // hooks.ts pre-translates the values to Linux paths (must cross untranslated,
    // /u); a wsl.exe terminal over a Windows worktree still carries C:\ paths
    // that WSLENV must translate (/p).
    ...['FABRICA_ROOT_PATH', 'FABRICA_WORKTREE_PATH', 'CONDUCTOR_ROOT_PATH', 'GHOSTX_ROOT_PATH'].map(
      (name) => `${name}/${env[name]?.startsWith('/') ? 'u' : 'p'}`
    ),
    // Why: a display name, never a path — never path-translate it.
    'FABRICA_WORKSPACE_NAME/u'
  ]
}

// Why: runHook spawns wsl.exe directly (archive hooks, windowless setup), and
// wsl.exe only imports Windows env vars named in WSLENV — so the setup vars
// must be registered there too, with the same /u-vs-/p flags as the PTY path (#9206).
export function addWorktreeSetupWslInteropEnv(env: Record<string, string | undefined>): void {
  applyWslenvPassthrough(env, worktreeSetupWslenvEntries(env))
}

export function addFABRICAWslInteropEnv(env: Record<string, string>): void {
  // Why: the endpoint is a Windows path (/p-translated so the guest reads it
  // via /mnt/c) until the WSL hook relay reports the guest home — then it is
  // already a guest-side POSIX path and must cross untranslated.
  const endpointFlag = env.FABRICA_AGENT_HOOK_ENDPOINT?.startsWith('/') ? 'u' : 'p'
  // Why: ONLY a guest-side POSIX overlay may cross. /p would path-translate a
  // Windows value into /mnt/c and let in-guest OpenCode adopt it as its config
  // root — reachable via the relay spawn's process.env (wsl-hook-relay-launch)
  // and via daemon-inherited env, which buildPtyHostEnv's delete cannot reach.
  const opencodeOverlayEntries = (['OPENCODE_CONFIG_DIR', 'FABRICA_OPENCODE_CONFIG_DIR'] as const)
    .filter((name) => env[name]?.startsWith('/'))
    .map((name) => `${name}/u`)
  // Why: wsl.exe only imports selected Windows env vars, so WSL needs the wrapper root, pane identity, and hook/OMP coordinates at start.
  const passthroughEntries = [
    'FABRICA_TERMINAL_HANDLE/u',
    'FABRICA_USER_DATA_PATH/p',
    'FABRICA_CLI_COMMAND/u',
    'FABRICA_PANE_KEY/u',
    'FABRICA_TAB_ID/u',
    'FABRICA_WORKTREE_ID/u',
    'FABRICA_AGENT_LAUNCH_TOKEN/u',
    `${SETUP_AGENT_SEQUENCE_STARTUP_COMMAND_ENV}/u`,
    `${SETUP_AGENT_SEQUENCE_STARTUP_SCRIPT_ENV}/u`,
    'FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_KIND/u',
    'FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_ID/u',
    'FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_INCARNATION/u',
    'FABRICA_AGENT_HOOK_PORT/u',
    'FABRICA_AGENT_HOOK_TOKEN/u',
    'FABRICA_AGENT_HOOK_ENV/u',
    'FABRICA_AGENT_HOOK_VERSION/u',
    `FABRICA_AGENT_HOOK_ENDPOINT/${endpointFlag}`,
    ...opencodeOverlayEntries,
    'FABRICA_WSL_HOOK_RELAY_VERSION/u',
    'FABRICA_WSL_HOOK_INSTANCE/u',
    'FABRICA_OMP_SOURCE_AGENT_DIR/p',
    'FABRICA_OMP_STATUS_EXTENSION/p',
    'FABRICA_PRIME_AGENT_STATUS_EXTENSION/p',
    ...worktreeSetupWslenvEntries(env)
  ]
  applyWslenvPassthrough(env, passthroughEntries)
}

export function stampWslOrchestrationCompatibilityHost(
  env: Record<string, string>,
  hostId: string | null | undefined,
  distro: string | null | undefined
): void {
  delete env[ORCHESTRATION_COMPATIBILITY_HOST_KIND_ENV]
  delete env[ORCHESTRATION_COMPATIBILITY_HOST_ID_ENV]
  delete env[ORCHESTRATION_COMPATIBILITY_HOST_INCARNATION_ENV]
  delete env[ORCHESTRATION_COMPATIBILITY_ATTACHMENT_ENV]
  const normalizedHostId = hostId?.trim()
  const normalizedDistro = distro?.trim()
  if (!normalizedHostId || !normalizedDistro) {
    return
  }
  env[ORCHESTRATION_COMPATIBILITY_HOST_KIND_ENV] = 'wsl'
  env[ORCHESTRATION_COMPATIBILITY_HOST_ID_ENV] = normalizedHostId
  env[ORCHESTRATION_COMPATIBILITY_HOST_INCARNATION_ENV] = normalizedDistro
}
