/* eslint-disable max-lines -- Why: owns both wrapper-file generation and the matching readiness scanner; splitting would fragment the wrapper/marker contract. */
/**
 * Shell-ready startup command support for local PTYs.
 *
 * Why: startup commands must wait until the shell has fully initialized. Provides shell wrapper
 * rcfiles that emit an OSC 777 marker after startup, plus a scanner that detects it.
 */
import { tmpdir } from 'node:os'
import { basename, win32 as pathWin32 } from 'node:path'
import { mkdirSync, writeFileSync, chmodSync, existsSync } from 'node:fs'
import type * as pty from 'node-pty'
import {
  encodePowerShellCommand,
  getPowerShellOsc133Bootstrap,
  isPowerShellExecutableName
} from '../powershell-osc133-bootstrap'
import { getPosixOmpShellWrapper } from '../pty/omp-shell-wrapper'
import { getPosixPrimeAgentShellWrapper } from '../pty/prime-agent-shell-wrapper'
import { buildStartupCommandSubmission } from '../../shared/startup-command-submission'
import {
  getFishShellReadyInitCommand,
  getZshEnvTemplate,
  getZshFinalZdotdirRestoreBlock,
  getZshShellReadyMarkerRegistrationBlock,
  getZshStartupFileSourceBlock
} from '../shell-templates'
export {
  createShellReadyScanState,
  drainShellReadyHeldBytes,
  scanForShellReady,
  SHELL_READY_MARKER_PREFIX
} from '../shell-ready-marker-scanner'
export type { ShellReadyScanResult, ShellReadyScanState } from '../shell-ready-marker-scanner'

let didEnsureShellReadyWrappers = false

const STARTUP_COMMAND_READY_MAX_WAIT_MS = 1500
const POST_SHELL_READY_STARTUP_COMMAND_DELAY_MS = 30
const POST_SHELL_READY_STARTUP_COMMAND_FALLBACK_MS = 200
const SHELL_READY_MARKER_ESCAPED = '\\033]777;FABRICA-shell-ready\\007'

export type ShellReadySignal = {
  postMarkerBytesObserved: boolean
}

// ── Shell wrapper files ─────────────────────────────────────────────

function getShellReadyWrapperRoot(): string {
  // Why: bundled into the daemon fork (no electron), so read FABRICA_USER_DATA_PATH rather than electron's userData; main and the fork both set it to the same path.
  const userDataPath = process.env.FABRICA_USER_DATA_PATH ?? tmpdir()
  return `${userDataPath}/shell-ready`
}

function getRequiredShellReadyWrapperPaths(root = getShellReadyWrapperRoot()): string[] {
  return [
    `${root}/zsh/.zshenv`,
    `${root}/zsh/.zprofile`,
    `${root}/zsh/.zshrc`,
    `${root}/zsh/.zlogin`,
    `${root}/bash/rcfile`
  ]
}

function shellReadyWrappersExist(root = getShellReadyWrapperRoot()): boolean {
  return getRequiredShellReadyWrapperPaths(root).every((path) => existsSync(path))
}

// Why: an FABRICA wrapper ZDOTDIR recurses; treat it as unset and fall back to HOME.
function normalizeOriginalZdotdirCandidate(value: string | undefined): string | null {
  if (!value) {
    return null
  }
  // Why: strip trailing slashes so wrapper paths match; `/` falls back to HOME.
  const normalized = value.replace(/\/+$/, '')
  if (!normalized || normalized.endsWith('/shell-ready/zsh')) {
    return null
  }
  return value
}

function resolveOriginalZdotdir(): string {
  return (
    normalizeOriginalZdotdirCandidate(process.env.ZDOTDIR) ||
    normalizeOriginalZdotdirCandidate(process.env.FABRICA_ORIG_ZDOTDIR) ||
    process.env.HOME ||
    ''
  )
}

function resolveOriginalZshenvSourceDir(): string {
  return normalizeOriginalZdotdirCandidate(process.env.ZDOTDIR) || process.env.HOME || ''
}

export function getBashShellReadyRcfileContent(): string {
  return `# FABRICA bash shell-ready wrapper
[[ -f /etc/profile ]] && source /etc/profile
if [[ -f "$HOME/.bash_profile" ]]; then
  source "$HOME/.bash_profile"
elif [[ -f "$HOME/.bash_login" ]]; then
  source "$HOME/.bash_login"
elif [[ -f "$HOME/.profile" ]]; then
  source "$HOME/.profile"
fi
# Why: enable bracketed paste so FABRICA can deliver a multiline startup prompt as
# a single literal paste (ESC[200~…ESC[201~). Without it, older readline builds
# treat each embedded newline as Enter and mangle the prompt into PS2
# continuation. Modern readline defaults this on; force it for the rest.
[[ $- == *i* ]] && bind 'set enable-bracketed-paste on' 2>/dev/null
# Why: preserve bash's normal login-shell contract. Many users already source
# ~/.bashrc from ~/.bash_profile; forcing ~/.bashrc again here would duplicate
# PATH edits, hooks, and prompt init in FABRICA startup-command shells.
__FABRICA_restore_attribution_path() {
  [[ -n "\${FABRICA_ATTRIBUTION_SHIM_DIR:-}" ]] || return 0
  case "$PATH" in
    "\${FABRICA_ATTRIBUTION_SHIM_DIR}"|"\${FABRICA_ATTRIBUTION_SHIM_DIR}:"*) return 0 ;;
  esac
  export PATH="\${FABRICA_ATTRIBUTION_SHIM_DIR}:$PATH"
}
__FABRICA_restore_attribution_path
__FABRICA_restore_agent_teams_path() {
  [[ -n "\${FABRICA_AGENT_TEAMS_SHIM_DIR:-}" ]] || return 0
  case "$PATH" in
    "\${FABRICA_AGENT_TEAMS_SHIM_DIR}"|"\${FABRICA_AGENT_TEAMS_SHIM_DIR}:"*) return 0 ;;
  esac
  export PATH="\${FABRICA_AGENT_TEAMS_SHIM_DIR}:$PATH"
}
__FABRICA_restore_agent_teams_path
# Why: user startup files may set the default OpenCode config after FABRICA's
# spawn env; restore the FABRICA-managed config dir before the first prompt.
[[ -n "\${FABRICA_OPENCODE_CONFIG_DIR:-}" ]] && export OPENCODE_CONFIG_DIR="\${FABRICA_OPENCODE_CONFIG_DIR}"
[[ -n "\${FABRICA_MIMOCODE_HOME:-}" ]] && export MIMOCODE_HOME="\${FABRICA_MIMOCODE_HOME}"
${getPosixOmpShellWrapper()}
${getPosixPrimeAgentShellWrapper()}
# Why: Codex must keep using FABRICA's runtime CODEX_HOME after profile scripts.
[[ -n "\${FABRICA_CODEX_HOME:-}" ]] && export CODEX_HOME="\${FABRICA_CODEX_HOME}"
# Why: emit OSC 133 C/D so terminal-command-lifecycle can drop stale agent
# status when the foreground command (e.g. an interrupted Claude/Codex CLI)
# exits — mirrors the zsh wrapper. Without this, bash users (default on most
# Linux distros) keep a stuck 'working' spinner for up to 30 min after the
# CLI exits without sending a Stop/SessionEnd hook.
__FABRICA_osc133_precmd() {
  local exit_code=$?
  __FABRICA_in_prompt_command=1
  if [[ -n "\${__FABRICA_in_command:-}" ]]; then
    printf "\\033]133;D;%s\\007" "$exit_code"
    unset __FABRICA_in_command
  fi
  printf "\\033]133;A\\007"
}
__FABRICA_osc133_prompt_done() {
  unset __FABRICA_in_prompt_command
}
__FABRICA_run_user_debug_trap() {
  if [[ -n "\${__FABRICA_user_debug_trap:-}" ]]; then
    eval "$__FABRICA_user_debug_trap" || true
  fi
}
__FABRICA_osc133_preexec() {
  __FABRICA_run_user_debug_trap
  [[ -z "\${__FABRICA_in_prompt_command:-}" ]] || return
  # Why: bash DEBUG fires for every simple command, including PROMPT_COMMAND
  # bodies. Skip our own prompt-time helpers so they don't mark the shell as
  # "in command" before the prompt has even drawn.
  case "$BASH_COMMAND" in
    *__FABRICA_osc133_precmd*|*__FABRICA_osc133_prompt_done*|*__FABRICA_prompt_mark*) return ;;
  esac
  printf "\\033]133;C\\007"
  __FABRICA_in_command=1
}
# Why: prepend so we capture $? before the user's PROMPT_COMMAND chain mutates it.
__FABRICA_normalize_prompt_command() {
  local __FABRICA_joined="" __FABRICA_prompt_part
  if [[ "$(declare -p PROMPT_COMMAND 2>/dev/null)" == "declare -a"* ]]; then
    for __FABRICA_prompt_part in "\${PROMPT_COMMAND[@]}"; do
      [[ -n "$__FABRICA_prompt_part" ]] || continue
      if [[ -n "$__FABRICA_joined" ]]; then
        __FABRICA_joined="$__FABRICA_joined;$__FABRICA_prompt_part"
      else
        __FABRICA_joined="$__FABRICA_prompt_part"
      fi
    done
    PROMPT_COMMAND="$__FABRICA_joined"
  fi
}
__FABRICA_prepend_prompt_command() {
  __FABRICA_normalize_prompt_command
  PROMPT_COMMAND="__FABRICA_osc133_precmd\${PROMPT_COMMAND:+;\${PROMPT_COMMAND}}"
}
__FABRICA_append_prompt_command() {
  local command="$1"
  __FABRICA_normalize_prompt_command
  if [[ -n "\${PROMPT_COMMAND:-}" ]]; then
    PROMPT_COMMAND="\${PROMPT_COMMAND};$command"
  else
    PROMPT_COMMAND="$command"
  fi
}
__FABRICA_prepend_prompt_command
# Why: append the marker through PROMPT_COMMAND so it fires after the login
# startup files have rebuilt the prompt, without re-running user rc files.
if [[ "\${FABRICA_SHELL_READY_MARKER:-0}" == "1" ]]; then
  __FABRICA_prompt_mark() {
    printf "${SHELL_READY_MARKER_ESCAPED}"
  }
  __FABRICA_append_prompt_command "__FABRICA_prompt_mark"
fi
__FABRICA_append_prompt_command "__FABRICA_osc133_prompt_done"
__FABRICA_debug_trap_spec="$(trap -p DEBUG)"
if [[ -n "$__FABRICA_debug_trap_spec" ]]; then
  __FABRICA_debug_trap_command="\${__FABRICA_debug_trap_spec#trap -- }"
  __FABRICA_debug_trap_command="\${__FABRICA_debug_trap_command% DEBUG}"
  eval "__FABRICA_user_debug_trap=$__FABRICA_debug_trap_command"
fi
unset __FABRICA_debug_trap_spec __FABRICA_debug_trap_command
unset -f __FABRICA_normalize_prompt_command __FABRICA_prepend_prompt_command __FABRICA_append_prompt_command
# Why: arm DEBUG after wrapper setup; otherwise bash treats our own rcfile
# commands as a foreground command and emits a fake C/D before the first prompt.
trap '__FABRICA_osc133_preexec' DEBUG
`
}

export function getZshShellReadyRcfileContent(): string {
  return `# FABRICA zsh shell-ready wrapper
${getZshStartupFileSourceBlock({
  fileName: '.zshrc',
  interactiveOnly: true,
  skipWhenHomeIsCurrentZdotdir: true
})}
__FABRICA_restore_attribution_path() {
  [[ -n "\${FABRICA_ATTRIBUTION_SHIM_DIR:-}" ]] || return 0
  case "$PATH" in
    "\${FABRICA_ATTRIBUTION_SHIM_DIR}"|"\${FABRICA_ATTRIBUTION_SHIM_DIR}:"*) return 0 ;;
  esac
  export PATH="\${FABRICA_ATTRIBUTION_SHIM_DIR}:$PATH"
}
[[ ! -o login ]] && __FABRICA_restore_attribution_path
__FABRICA_restore_agent_teams_path() {
  [[ -n "\${FABRICA_AGENT_TEAMS_SHIM_DIR:-}" ]] || return 0
  case "$PATH" in
    "\${FABRICA_AGENT_TEAMS_SHIM_DIR}"|"\${FABRICA_AGENT_TEAMS_SHIM_DIR}:"*) return 0 ;;
  esac
  export PATH="\${FABRICA_AGENT_TEAMS_SHIM_DIR}:$PATH"
}
[[ ! -o login ]] && __FABRICA_restore_agent_teams_path
if [[ ! -o login ]]; then
  # Why: ~/.zshrc can export the user's default OpenCode config after spawn.
  [[ -n "\${FABRICA_OPENCODE_CONFIG_DIR:-}" ]] && export OPENCODE_CONFIG_DIR="\${FABRICA_OPENCODE_CONFIG_DIR}"
[[ -n "\${FABRICA_MIMOCODE_HOME:-}" ]] && export MIMOCODE_HOME="\${FABRICA_MIMOCODE_HOME}"
  ${getPosixOmpShellWrapper()}
  ${getPosixPrimeAgentShellWrapper()}
  # Why: Codex must keep using FABRICA's runtime CODEX_HOME after rc files.
  [[ -n "\${FABRICA_CODEX_HOME:-}" ]] && export CODEX_HOME="\${FABRICA_CODEX_HOME}"
fi
__FABRICA_osc133_precmd() {
  local exit_code=$?
  if [[ -n "\${__FABRICA_in_command:-}" ]]; then
    printf "\\033]133;D;%s\\007" "$exit_code"
    unset __FABRICA_in_command
  fi
  printf "\\033]133;A\\007"
}
__FABRICA_osc133_preexec() {
  printf "\\033]133;C\\007"
  __FABRICA_in_command=1
}
# Why: prepend so FABRICA captures $? before user prompt hooks can overwrite it.
precmd_functions=(__FABRICA_osc133_precmd \${precmd_functions[@]})
preexec_functions=(__FABRICA_osc133_preexec \${preexec_functions[@]})
if [[ ! -o login ]]; then
${getZshFinalZdotdirRestoreBlock()}
fi
`
}

export function ensureShellReadyWrappersAt(root = getShellReadyWrapperRoot()): void {
  if (didEnsureShellReadyWrappers && shellReadyWrappersExist(root)) {
    return
  }
  didEnsureShellReadyWrappers = true

  const zshDir = `${root}/zsh`
  const bashDir = `${root}/bash`

  const zshEnv = getZshEnvTemplate(zshDir)
  const zshProfile = `# FABRICA zsh shell-ready wrapper
${getZshStartupFileSourceBlock({ fileName: '.zprofile' })}
`
  const zshRc = getZshShellReadyRcfileContent()
  const zshLogin = `# FABRICA zsh shell-ready wrapper
${getZshStartupFileSourceBlock({ fileName: '.zlogin', interactiveOnly: true })}
__FABRICA_restore_attribution_path() {
  [[ -n "\${FABRICA_ATTRIBUTION_SHIM_DIR:-}" ]] || return 0
  case "$PATH" in
    "\${FABRICA_ATTRIBUTION_SHIM_DIR}"|"\${FABRICA_ATTRIBUTION_SHIM_DIR}:"*) return 0 ;;
  esac
  export PATH="\${FABRICA_ATTRIBUTION_SHIM_DIR}:$PATH"
}
__FABRICA_restore_attribution_path
__FABRICA_restore_agent_teams_path() {
  [[ -n "\${FABRICA_AGENT_TEAMS_SHIM_DIR:-}" ]] || return 0
  case "$PATH" in
    "\${FABRICA_AGENT_TEAMS_SHIM_DIR}"|"\${FABRICA_AGENT_TEAMS_SHIM_DIR}:"*) return 0 ;;
  esac
  export PATH="\${FABRICA_AGENT_TEAMS_SHIM_DIR}:$PATH"
}
__FABRICA_restore_agent_teams_path
# Why: .zlogin is the final login startup file before the prompt is shown.
[[ -n "\${FABRICA_OPENCODE_CONFIG_DIR:-}" ]] && export OPENCODE_CONFIG_DIR="\${FABRICA_OPENCODE_CONFIG_DIR}"
[[ -n "\${FABRICA_MIMOCODE_HOME:-}" ]] && export MIMOCODE_HOME="\${FABRICA_MIMOCODE_HOME}"
${getPosixOmpShellWrapper()}
${getPosixPrimeAgentShellWrapper()}
[[ -n "\${FABRICA_CODEX_HOME:-}" ]] && export CODEX_HOME="\${FABRICA_CODEX_HOME}"
${getZshShellReadyMarkerRegistrationBlock(SHELL_READY_MARKER_ESCAPED)}
${getZshFinalZdotdirRestoreBlock()}
`
  const bashRc = getBashShellReadyRcfileContent()

  const files = [
    [`${zshDir}/.zshenv`, zshEnv],
    [`${zshDir}/.zprofile`, zshProfile],
    [`${zshDir}/.zshrc`, zshRc],
    [`${zshDir}/.zlogin`, zshLogin],
    [`${bashDir}/rcfile`, bashRc]
  ] as const

  try {
    for (const [path, content] of files) {
      const dir = path.slice(0, path.lastIndexOf('/'))
      mkdirSync(dir, { recursive: true })
      writeFileSync(path, content, 'utf8')
      chmodSync(path, 0o644)
    }
  } catch (error) {
    // Why: degrade gracefully — a failed wrapper (read-only FS, perms, disk) just means no ready marker, PTY stays usable.
    const errorMessage =
      error instanceof Error
        ? `${error.message} (${(error as NodeJS.ErrnoException).code || 'unknown'})`
        : String(error)
    console.error(`[shell-ready] Failed to create wrapper files in ${root}: ${errorMessage}`)
    console.error('[shell-ready] Shell will launch without wrapper (no shell-ready marker)')
    // Reset the flag so next attempt will try again
    didEnsureShellReadyWrappers = false
  }
}

function ensureShellReadyWrappers(): void {
  if (process.platform === 'win32') {
    return
  }
  ensureShellReadyWrappersAt()
}

// ── Shell launch config ─────────────────────────────────────────────

export type ShellReadyLaunchConfig = {
  args: string[] | null
  env: Record<string, string>
  supportsReadyMarker: boolean
}

function getWrappedShellLaunchConfig(
  shellPath: string,
  options: { emitReadyMarker: boolean }
): ShellReadyLaunchConfig {
  const shellName = pathWin32.basename(basename(shellPath)).toLowerCase()

  if (shellName === 'zsh') {
    ensureShellReadyWrappers()
    return {
      args: ['-l'],
      env: {
        FABRICA_ORIG_ZDOTDIR: resolveOriginalZdotdir(),
        FABRICA_ZSHENV_SOURCE_DIR: resolveOriginalZshenvSourceDir(),
        ZDOTDIR: `${getShellReadyWrapperRoot()}/zsh`,
        FABRICA_SHELL_READY_MARKER: options.emitReadyMarker ? '1' : '0'
      },
      supportsReadyMarker: options.emitReadyMarker
    }
  }

  if (shellName === 'bash') {
    ensureShellReadyWrappers()
    return {
      args: ['--rcfile', `${getShellReadyWrapperRoot()}/bash/rcfile`],
      env: {
        FABRICA_SHELL_READY_MARKER: options.emitReadyMarker ? '1' : '0'
      },
      supportsReadyMarker: options.emitReadyMarker
    }
  }

  if (isPowerShellExecutableName(shellName)) {
    return {
      args: [
        '-NoLogo',
        '-NoExit',
        '-EncodedCommand',
        encodePowerShellCommand(getPowerShellOsc133Bootstrap())
      ],
      env: {},
      supportsReadyMarker: false
    }
  }

  // Why: mirrors daemon/shell-ready.ts; attribution-only fish stays unwrapped.
  if (shellName === 'fish' && options.emitReadyMarker) {
    return {
      args: ['-l', '-C', getFishShellReadyInitCommand(SHELL_READY_MARKER_ESCAPED)],
      env: { FABRICA_SHELL_READY_MARKER: '1' },
      supportsReadyMarker: true
    }
  }

  return {
    args: null,
    env: {},
    supportsReadyMarker: false
  }
}

export function getShellReadyLaunchConfig(shellPath: string): ShellReadyLaunchConfig {
  return getWrappedShellLaunchConfig(shellPath, { emitReadyMarker: true })
}

export function getAttributionShellLaunchConfig(shellPath: string): ShellReadyLaunchConfig {
  return getWrappedShellLaunchConfig(shellPath, { emitReadyMarker: false })
}

// ── Startup command writer ──────────────────────────────────────────

export function writeStartupCommandWhenShellReady(
  readyPromise: Promise<void | ShellReadySignal>,
  proc: pty.IPty,
  startupCommand: string,
  onExit: (cleanup: () => void) => void,
  // Why: only FABRICA-wrapped bash/zsh have bracketed-paste active; other shells use the raw path to avoid echoing the ESC[200~ markers.
  options: { bracketedPasteSafe?: boolean } = {}
): void {
  let sent = false
  let postReadyTimer: ReturnType<typeof setTimeout> | null = null
  let postReadyDataDisposable: { dispose: () => void } | null = null

  const cleanup = (): void => {
    sent = true
    if (postReadyTimer !== null) {
      clearTimeout(postReadyTimer)
      postReadyTimer = null
    }
    postReadyDataDisposable?.dispose()
    postReadyDataDisposable = null
  }

  const flush = (): void => {
    if (sent) {
      return
    }
    sent = true
    postReadyDataDisposable?.dispose()
    postReadyDataDisposable = null
    if (postReadyTimer !== null) {
      clearTimeout(postReadyTimer)
      postReadyTimer = null
    }
    // Why: run in the same interactive shell (not `shell -c`) so the session survives after the agent exits.
    // Why CR on Windows: PSReadLine/cmd.exe submit on `\r`, not LF; POSIX treats either as Enter under ICRNL.
    const submit = process.platform === 'win32' ? '\r' : '\n'
    // Why: single write after the ready barrier avoids incremental-paste char drops; multiline is bracketed-paste wrapped so newlines don't submit early.
    proc.write(
      buildStartupCommandSubmission(startupCommand, {
        submit,
        bracketedPasteSafe: options.bracketedPasteSafe === true
      })
    )
  }

  const schedulePostReadyFlush = (): void => {
    postReadyTimer = setTimeout(flush, POST_SHELL_READY_STARTUP_COMMAND_DELAY_MS)
  }

  readyPromise.then((signal) => {
    if (sent) {
      return
    }
    // Why: marker fires from precmd before the line editor takes the PTY out of ECHO; writing now double-echoes the command, so settle first.
    if (signal?.postMarkerBytesObserved === true) {
      schedulePostReadyFlush()
      return
    }
    postReadyDataDisposable = proc.onData(() => {
      postReadyDataDisposable?.dispose()
      postReadyDataDisposable = null
      if (postReadyTimer !== null) {
        clearTimeout(postReadyTimer)
      }
      schedulePostReadyFlush()
    })
    postReadyTimer = setTimeout(() => {
      postReadyDataDisposable?.dispose()
      postReadyDataDisposable = null
      postReadyTimer = null
      flush()
    }, POST_SHELL_READY_STARTUP_COMMAND_FALLBACK_MS)
  })
  onExit(cleanup)
}

export { STARTUP_COMMAND_READY_MAX_WAIT_MS }
