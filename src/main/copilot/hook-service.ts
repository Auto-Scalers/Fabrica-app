/* eslint-disable max-lines -- Why: local status/install/remove and SSH remote
   install must share the same Copilot event list, script body, and
   managed-command matching so local and remote hook behavior cannot drift. */
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { SFTPWrapper } from 'ssh2'
import type { AgentHookInstallState, AgentHookInstallStatus } from '../../shared/agent-hook-types'
import {
  createManagedCommandMatcher,
  getSharedManagedScriptPath,
  readHooksJson,
  removeManagedCommands,
  wrapPosixHookCommand,
  wrapWindowsHookCommand,
  writeHooksJson,
  writeManagedScript,
  type HookDefinition
} from '../agent-hooks/installer-utils'
import { refreshManagedScriptIfPresent } from '../agent-hooks/managed-hook-script-refresh'
import {
  readHooksJsonRemote,
  writeHooksJsonRemote,
  writeManagedScriptRemote
} from '../agent-hooks/installer-utils-remote'
import { buildPosixHookPayloadCapture } from '../agent-hooks/hook-stdin-contract'

// Why: Copilot's user-level hook files can use VS Code-compatible PascalCase
// names, which match the event vocabulary already normalized by FABRICA's hook
// server and avoid wrapper-side event remapping.
const COPILOT_EVENTS = [
  'SessionStart',
  'SessionEnd',
  'UserPromptSubmit',
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  // Why: GitHub's current reference documents subagentStart with only the
  // camelCase payload shape. The wrapper passes the event name separately, so
  // FABRICA can normalize it without depending on a PascalCase payload.
  'subagentStart',
  'SubagentStop',
  'PreCompact',
  'Stop',
  'ErrorOccurred',
  'PermissionRequest',
  'Notification'
] as const

function getCopilotHome(): string {
  const fromEnv = process.env.COPILOT_HOME?.trim()
  return fromEnv ? fromEnv : join(homedir(), '.copilot')
}

function getConfigPath(): string {
  return join(getCopilotHome(), 'hooks', 'FABRICA.json')
}

function getManagedScriptFileName(): string {
  return process.platform === 'win32' ? 'copilot-hook.ps1' : 'copilot-hook.sh'
}

function getManagedScriptPath(): string {
  return getSharedManagedScriptPath(getManagedScriptFileName())
}

function getManagedCommand(scriptPath: string, eventName: string): string {
  if (process.platform !== 'win32') {
    return wrapPosixHookCommand(scriptPath, { FABRICA_COPILOT_HOOK_EVENT: eventName })
  }
  return wrapWindowsHookCommand(scriptPath, { FABRICA_COPILOT_HOOK_EVENT: eventName })
}

function getManagedHookDefinition(command: string): HookDefinition {
  return process.platform === 'win32'
    ? { type: 'command', powershell: command, timeoutSec: 5 }
    : { type: 'command', bash: command, timeoutSec: 5 }
}

function getRemoteManagedHookDefinition(command: string): HookDefinition {
  return { type: 'command', bash: command, timeoutSec: 5 }
}

function definitionHasCurrentCommand(definition: HookDefinition, command: string): boolean {
  return (
    definition.command === command ||
    definition.bash === command ||
    definition.powershell === command ||
    (Array.isArray(definition.hooks) && definition.hooks.some((hook) => hook.command === command))
  )
}

function definitionHasStaleManagedCommand(
  definition: HookDefinition,
  currentCommand: string | null,
  isManagedCommand: (command: string | undefined) => boolean
): boolean {
  const commands = [definition.command, definition.bash, definition.powershell]
  if (commands.some((command) => isManagedCommand(command) && command !== currentCommand)) {
    return true
  }
  return (
    Array.isArray(definition.hooks) &&
    definition.hooks.some(
      (hook) => isManagedCommand(hook.command) && hook.command !== currentCommand
    )
  )
}

function definitionsChanged(before: HookDefinition[], after: HookDefinition[]): boolean {
  return (
    before.length !== after.length ||
    after.some((definition, index) => definition !== before[index])
  )
}

function getManagedScript(target: 'local' | 'posix' = 'local'): string {
  if (target === 'local' && process.platform === 'win32') {
    return [
      "Write-Output '{}'",
      '$inputData = [Console]::In.ReadToEnd()',
      // Why: endpoint.cmd is cmd syntax, not PowerShell. Parse its `set KEY=...`
      // lines so surviving PTYs can refresh to the current FABRICA server.
      'if ($env:FABRICA_AGENT_HOOK_ENDPOINT -and (Test-Path -LiteralPath $env:FABRICA_AGENT_HOOK_ENDPOINT)) {',
      '  try {',
      '    Get-Content -LiteralPath $env:FABRICA_AGENT_HOOK_ENDPOINT | ForEach-Object {',
      "      if ($_ -match '^set ([A-Za-z0-9_]+)=(.*)$') {",
      "        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')",
      '      }',
      '    }',
      '  } catch {}',
      '}',
      'if (-not $env:FABRICA_AGENT_HOOK_PORT -or -not $env:FABRICA_AGENT_HOOK_TOKEN -or -not $env:FABRICA_PANE_KEY) { exit 0 }',
      'if ([string]::IsNullOrWhiteSpace($inputData)) { exit 0 }',
      'try {',
      '  $payload = $inputData | ConvertFrom-Json',
      '  $body = @{',
      '    paneKey = $env:FABRICA_PANE_KEY',
      '    launchToken = $env:FABRICA_AGENT_LAUNCH_TOKEN',
      '    tabId = $env:FABRICA_TAB_ID',
      '    worktreeId = $env:FABRICA_WORKTREE_ID',
      '    hookEventName = $env:FABRICA_COPILOT_HOOK_EVENT',
      '    env = $env:FABRICA_AGENT_HOOK_ENV',
      '    version = $env:FABRICA_AGENT_HOOK_VERSION',
      '    payload = $payload',
      '  } | ConvertTo-Json -Depth 100',
      "  Invoke-WebRequest -UseBasicParsing -Method Post -Uri ('http://127.0.0.1:' + $env:FABRICA_AGENT_HOOK_PORT + '/hook/copilot') -Headers @{ 'Content-Type'='application/json'; 'X-FABRICA-Agent-Hook-Token'=$env:FABRICA_AGENT_HOOK_TOKEN } -Body $body -TimeoutSec 2 | Out-Null",
      '} catch {}',
      'exit 0',
      ''
    ].join('\r\n')
  }

  return [
    '#!/bin/sh',
    "printf '{}\\n'",
    ...buildPosixHookPayloadCapture(),
    // Why: Copilot consumes stdout for some hooks, so stdout is emitted before
    // endpoint refresh, stdin parsing, or the network POST can fail.
    'if [ -n "$FABRICA_AGENT_HOOK_ENDPOINT" ] && [ -r "$FABRICA_AGENT_HOOK_ENDPOINT" ]; then',
    '  . "$FABRICA_AGENT_HOOK_ENDPOINT" 2>/dev/null || :',
    'fi',
    'if [ -z "$FABRICA_AGENT_HOOK_PORT" ] || [ -z "$FABRICA_AGENT_HOOK_TOKEN" ] || [ -z "$FABRICA_PANE_KEY" ]; then',
    '  exit 0',
    'fi',
    // Why: pipe payload to curl's stdin (`payload@-`) instead of an inline
    // `payload=$VALUE` arg, so tens-of-KB tool output stays off the curl
    // command line (EDR command-line false positives). Wire body is identical.
    'printf \'%s\' "$payload" | curl -sS -X POST "http://127.0.0.1:${FABRICA_AGENT_HOOK_PORT}/hook/copilot" \\',
    '  --connect-timeout 0.5 --max-time 1.5 \\',
    '  -H "Content-Type: application/x-www-form-urlencoded" \\',
    '  -H "X-FABRICA-Agent-Hook-Token: ${FABRICA_AGENT_HOOK_TOKEN}" \\',
    '  --data-urlencode "paneKey=${FABRICA_PANE_KEY}" \\',
    '  --data-urlencode "tabId=${FABRICA_TAB_ID}" \\',
    '  --data-urlencode "launchToken=${FABRICA_AGENT_LAUNCH_TOKEN}" \\',
    '  --data-urlencode "worktreeId=${FABRICA_WORKTREE_ID}" \\',
    '  --data-urlencode "hookEventName=${FABRICA_COPILOT_HOOK_EVENT}" \\',
    '  --data-urlencode "env=${FABRICA_AGENT_HOOK_ENV}" \\',
    '  --data-urlencode "version=${FABRICA_AGENT_HOOK_VERSION}" \\',
    '  --data-urlencode "payload@-" >/dev/null 2>&1 || true',
    'exit 0',
    ''
  ].join('\n')
}

export class CopilotHookService {
  async refreshManagedScripts(): Promise<void> {
    await refreshManagedScriptIfPresent(getManagedScriptPath(), getManagedScript())
  }

  getStatus(): AgentHookInstallStatus {
    const configPath = getConfigPath()
    const scriptPath = getManagedScriptPath()
    const config = readHooksJson(configPath)
    if (!config) {
      return {
        agent: 'copilot',
        state: 'error',
        configPath,
        managedHooksPresent: false,
        detail: 'Could not parse Copilot hooks/FABRICA.json'
      }
    }

    const isManagedCommand = createManagedCommandMatcher(getManagedScriptFileName())
    const missing: string[] = []
    let presentCount = 0
    let staleManagedPresent = false
    const managedEvents = new Set<string>(COPILOT_EVENTS)
    for (const eventName of COPILOT_EVENTS) {
      const command = getManagedCommand(scriptPath, eventName)
      const definitions = Array.isArray(config.hooks?.[eventName]) ? config.hooks![eventName]! : []
      const hasCurrentCommand = definitions.some((definition) =>
        definitionHasCurrentCommand(definition, command)
      )
      if (hasCurrentCommand) {
        presentCount += 1
      } else {
        missing.push(eventName)
      }
    }
    for (const [eventName, definitions] of Object.entries(config.hooks ?? {})) {
      if (!Array.isArray(definitions)) {
        continue
      }
      const currentCommand = managedEvents.has(eventName)
        ? getManagedCommand(scriptPath, eventName)
        : null
      staleManagedPresent =
        staleManagedPresent ||
        definitions.some((definition) =>
          definitionHasStaleManagedCommand(definition, currentCommand, isManagedCommand)
        )
    }

    const managedHooksPresent = presentCount > 0 || staleManagedPresent
    let state: AgentHookInstallState
    let detail: string | null
    if (config.disableAllHooks === true && managedHooksPresent) {
      state = 'partial'
      detail = 'Managed Copilot hook file is disabled'
    } else if (staleManagedPresent) {
      state = 'partial'
      detail = 'Managed Copilot hook file contains stale entries'
    } else if (missing.length === 0) {
      state = 'installed'
      detail = null
    } else if (presentCount === 0 && !staleManagedPresent) {
      state = 'not_installed'
      detail = null
    } else {
      state = 'partial'
      detail = `Managed hook missing for events: ${missing.join(', ')}`
    }
    return { agent: 'copilot', state, configPath, managedHooksPresent, detail }
  }

  install(): AgentHookInstallStatus {
    const configPath = getConfigPath()
    const scriptPath = getManagedScriptPath()
    const config = readHooksJson(configPath)
    if (!config) {
      return {
        agent: 'copilot',
        state: 'error',
        configPath,
        managedHooksPresent: false,
        detail: 'Could not parse Copilot hooks/FABRICA.json'
      }
    }

    const nextHooks = { ...config.hooks }
    const managedEvents = new Set<string>(COPILOT_EVENTS)
    const isManagedCommand = createManagedCommandMatcher(getManagedScriptFileName())

    for (const [eventName, definitions] of Object.entries(nextHooks)) {
      if (managedEvents.has(eventName) || !Array.isArray(definitions)) {
        continue
      }
      const cleaned = removeManagedCommands(definitions, isManagedCommand)
      if (cleaned.length === 0) {
        delete nextHooks[eventName]
      } else {
        nextHooks[eventName] = cleaned
      }
    }

    for (const eventName of COPILOT_EVENTS) {
      const current = Array.isArray(nextHooks[eventName]) ? nextHooks[eventName] : []
      const cleaned = removeManagedCommands(current, isManagedCommand)
      nextHooks[eventName] = [
        ...cleaned,
        getManagedHookDefinition(getManagedCommand(scriptPath, eventName))
      ]
    }

    config.version = 1
    delete config.disableAllHooks
    config.hooks = nextHooks
    writeManagedScript(scriptPath, getManagedScript())
    writeHooksJson(configPath, config)
    return this.getStatus()
  }

  async installRemote(sftp: SFTPWrapper, remoteHome: string): Promise<AgentHookInstallStatus> {
    const home = remoteHome.replace(/\/$/, '')
    const remoteConfigPath = `${home}/.copilot/hooks/FABRICA.json`
    const remoteScriptPath = `${home}/.fabrica-factory/agent-hooks/copilot-hook.sh`

    try {
      const config = await readHooksJsonRemote(sftp, remoteConfigPath)
      if (!config) {
        return {
          agent: 'copilot',
          state: 'error',
          configPath: remoteConfigPath,
          managedHooksPresent: false,
          detail: 'Could not parse remote Copilot hooks/FABRICA.json'
        }
      }

      const nextHooks = { ...config.hooks }
      const managedEvents = new Set<string>(COPILOT_EVENTS)
      const isManagedCommand = createManagedCommandMatcher('copilot-hook.sh')

      for (const [eventName, definitions] of Object.entries(nextHooks)) {
        if (managedEvents.has(eventName) || !Array.isArray(definitions)) {
          continue
        }
        const cleaned = removeManagedCommands(definitions, isManagedCommand)
        if (cleaned.length === 0) {
          delete nextHooks[eventName]
        } else {
          nextHooks[eventName] = cleaned
        }
      }

      for (const eventName of COPILOT_EVENTS) {
        const current = Array.isArray(nextHooks[eventName]) ? nextHooks[eventName] : []
        const cleaned = removeManagedCommands(current, isManagedCommand)
        nextHooks[eventName] = [
          ...cleaned,
          getRemoteManagedHookDefinition(
            wrapPosixHookCommand(remoteScriptPath, { FABRICA_COPILOT_HOOK_EVENT: eventName })
          )
        ]
      }

      config.version = 1
      delete config.disableAllHooks
      config.hooks = nextHooks
      // Why: SSH remotes use POSIX scripts regardless of FABRICA's local OS. Write
      // the script before hooks/FABRICA.json so a partial install cannot point
      // Copilot at a missing managed command.
      await writeManagedScriptRemote(sftp, remoteScriptPath, getManagedScript('posix'))
      await writeHooksJsonRemote(sftp, remoteConfigPath, config)

      return {
        agent: 'copilot',
        state: 'installed',
        configPath: remoteConfigPath,
        managedHooksPresent: true,
        detail: null
      }
    } catch (err) {
      return {
        agent: 'copilot',
        state: 'error',
        configPath: remoteConfigPath,
        managedHooksPresent: false,
        detail: err instanceof Error ? err.message : String(err)
      }
    }
  }

  remove(): AgentHookInstallStatus {
    const configPath = getConfigPath()
    if (!existsSync(configPath)) {
      return this.getStatus()
    }
    const config = readHooksJson(configPath)
    if (!config) {
      return {
        agent: 'copilot',
        state: 'error',
        configPath,
        managedHooksPresent: false,
        detail: 'Could not parse Copilot hooks/FABRICA.json'
      }
    }

    const nextHooks = { ...config.hooks }
    const isManagedCommand = createManagedCommandMatcher(getManagedScriptFileName())
    let changed = false
    for (const [eventName, definitions] of Object.entries(nextHooks)) {
      if (!Array.isArray(definitions)) {
        continue
      }
      const cleaned = removeManagedCommands(definitions, isManagedCommand)
      changed = changed || definitionsChanged(definitions, cleaned)
      if (cleaned.length === 0) {
        delete nextHooks[eventName]
      } else {
        nextHooks[eventName] = cleaned
      }
    }
    if (!changed) {
      return this.getStatus()
    }
    config.hooks = nextHooks
    writeHooksJson(configPath, config)
    return this.getStatus()
  }
}

export const copilotHookService = new CopilotHookService()
