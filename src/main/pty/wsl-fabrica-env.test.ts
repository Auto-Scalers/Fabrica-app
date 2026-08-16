import { describe, expect, it } from 'vitest'
import {
  SETUP_AGENT_SEQUENCE_STARTUP_COMMAND_ENV,
  SETUP_AGENT_SEQUENCE_STARTUP_SCRIPT_ENV
} from '../../shared/setup-agent-sequencing'
import {
  addFABRICAWslInteropEnv,
  addWorktreeSetupWslInteropEnv,
  stampWslOrchestrationCompatibilityHost
} from './wsl-fabrica-env'

describe('addFABRICAWslInteropEnv', () => {
  it('marks the FABRICA terminal handle for Windows to WSL env import', () => {
    const env: Record<string, string> = { FABRICA_TERMINAL_HANDLE: 'term_wsl' }

    addFABRICAWslInteropEnv(env)

    expect(env.WSLENV).toBe('FABRICA_TERMINAL_HANDLE/u')
  })

  it('imports setup-gated startup env into WSL without path translation', () => {
    const env: Record<string, string> = {
      [SETUP_AGENT_SEQUENCE_STARTUP_COMMAND_ENV]: 'codex',
      [SETUP_AGENT_SEQUENCE_STARTUP_SCRIPT_ENV]: 'while :; do sleep 1; done'
    }

    addFABRICAWslInteropEnv(env)

    expect(env.WSLENV?.split(':')).toEqual([
      `${SETUP_AGENT_SEQUENCE_STARTUP_COMMAND_ENV}/u`,
      `${SETUP_AGENT_SEQUENCE_STARTUP_SCRIPT_ENV}/u`
    ])
  })

  it('preserves existing WSLENV entries and does not duplicate the handle entry', () => {
    const env: Record<string, string> = {
      WSLENV: 'FOO/u:FABRICA_TERMINAL_HANDLE/u:BAR/p'
    }

    addFABRICAWslInteropEnv(env)

    expect(env.WSLENV).toBe('FOO/u:FABRICA_TERMINAL_HANDLE/u:BAR/p')
  })

  it('marks OMP status and hook env for Windows to WSL import', () => {
    const env: Record<string, string> = {
      FABRICA_TERMINAL_HANDLE: 'term_wsl',
      FABRICA_USER_DATA_PATH: 'C:\\Users\\jin\\AppData\\Roaming\\FABRICA',
      FABRICA_CLI_COMMAND: 'FABRICA-ide',
      FABRICA_OMP_STATUS_EXTENSION: 'C:\\Users\\jin\\.omp\\agent\\extensions\\FABRICA-agent-status.ts',
      FABRICA_PRIME_AGENT_STATUS_EXTENSION:
        'C:\\Users\\jin\\AppData\\Roaming\\FABRICA\\prime-agent-managed-status-extension\\FABRICA-agent-status.ts',
      FABRICA_PANE_KEY: 'tab-1:leaf-1',
      FABRICA_TAB_ID: 'tab-1',
      FABRICA_WORKTREE_ID: 'repo::\\\\wsl.localhost\\Ubuntu\\home\\jin\\repo',
      FABRICA_AGENT_LAUNCH_TOKEN: 'launch-secret',
      FABRICA_AGENT_HOOK_PORT: '4567',
      FABRICA_AGENT_HOOK_TOKEN: 'token',
      FABRICA_AGENT_HOOK_ENV: 'dev',
      FABRICA_AGENT_HOOK_VERSION: '1',
      FABRICA_WSL_HOOK_INSTANCE: 'testinstance',
      FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_KIND: 'wsl',
      FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_ID: 'local',
      FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_INCARNATION: 'Ubuntu'
    }

    addFABRICAWslInteropEnv(env)

    expect(env.WSLENV).toContain('FABRICA_TERMINAL_HANDLE/u')
    expect(env.WSLENV).toContain('FABRICA_USER_DATA_PATH/p')
    expect(env.WSLENV).toContain('FABRICA_CLI_COMMAND/u')
    expect(env.WSLENV).toContain('FABRICA_OMP_STATUS_EXTENSION/p')
    expect(env.WSLENV).toContain('FABRICA_PRIME_AGENT_STATUS_EXTENSION/p')
    expect(env.WSLENV).toContain('FABRICA_PANE_KEY/u')
    expect(env.WSLENV).toContain('FABRICA_TAB_ID/u')
    expect(env.WSLENV).toContain('FABRICA_WORKTREE_ID/u')
    expect(env.WSLENV).toContain('FABRICA_AGENT_LAUNCH_TOKEN/u')
    expect(env.WSLENV).toContain('FABRICA_AGENT_HOOK_PORT/u')
    expect(env.WSLENV).toContain('FABRICA_AGENT_HOOK_TOKEN/u')
    expect(env.WSLENV).toContain('FABRICA_AGENT_HOOK_ENV/u')
    expect(env.WSLENV).toContain('FABRICA_AGENT_HOOK_VERSION/u')
    expect(env.WSLENV).toContain('FABRICA_WSL_HOOK_INSTANCE/u')
    expect(env.WSLENV).toContain('FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_KIND/u')
    expect(env.WSLENV).toContain('FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_ID/u')
    expect(env.WSLENV).toContain('FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_INCARNATION/u')
  })

  it('overwrites caller host evidence with native runtime WSL authority', () => {
    const env = {
      FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_KIND: 'ssh',
      FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_ID: 'caller-host',
      FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_INCARNATION: 'caller-incarnation',
      FABRICA_ORCHESTRATION_COMPATIBILITY_ATTACHMENT: 'caller-attachment'
    }

    stampWslOrchestrationCompatibilityHost(env, 'local', 'Ubuntu')

    expect(env).toEqual({
      FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_KIND: 'wsl',
      FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_ID: 'local',
      FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_INCARNATION: 'Ubuntu'
    })
  })

  it('clears inherited host evidence outside a runtime-owned WSL scope', () => {
    const env = {
      FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_KIND: 'ssh',
      FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_ID: 'caller-host',
      FABRICA_ORCHESTRATION_COMPATIBILITY_HOST_INCARNATION: 'caller-incarnation',
      FABRICA_ORCHESTRATION_COMPATIBILITY_ATTACHMENT: 'caller-attachment'
    }

    stampWslOrchestrationCompatibilityHost(env, 'local', null)

    expect(env).toEqual({})
  })

  it('path-translates a Windows hook endpoint but passes a guest-side one untouched', () => {
    const windowsEnv: Record<string, string> = {
      FABRICA_AGENT_HOOK_ENDPOINT: 'C:\\Users\\jin\\AppData\\Roaming\\FABRICA\\agent-hooks\\endpoint.cmd'
    }
    addFABRICAWslInteropEnv(windowsEnv)
    expect(windowsEnv.WSLENV).toContain('FABRICA_AGENT_HOOK_ENDPOINT/p')

    const guestEnv: Record<string, string> = {
      FABRICA_AGENT_HOOK_ENDPOINT: '/home/jin/.FABRICA-wsl/agent-hooks/port-4567/endpoint.env'
    }
    addFABRICAWslInteropEnv(guestEnv)
    expect(guestEnv.WSLENV).toContain('FABRICA_AGENT_HOOK_ENDPOINT/u')
    expect(guestEnv.WSLENV).not.toContain('FABRICA_AGENT_HOOK_ENDPOINT/p')
  })

  it('tags pre-translated Linux setup paths /u so WSLENV does not translate them again (#9206)', () => {
    const env: Record<string, string> = {
      FABRICA_ROOT_PATH: '/home/jin/repo',
      FABRICA_WORKTREE_PATH: '/home/jin/repo-worktrees/fix-1',
      FABRICA_WORKSPACE_NAME: 'fix-1',
      CONDUCTOR_ROOT_PATH: '/home/jin/repo',
      GHOSTX_ROOT_PATH: '/home/jin/repo'
    }

    addFABRICAWslInteropEnv(env)

    // /u (not /p): hooks.ts already converted these to Linux paths before
    // spawn, so a /p flag would make WSLENV double-translate them.
    expect(env.WSLENV).toContain('FABRICA_ROOT_PATH/u')
    expect(env.WSLENV).toContain('FABRICA_WORKTREE_PATH/u')
    expect(env.WSLENV).toContain('CONDUCTOR_ROOT_PATH/u')
    expect(env.WSLENV).toContain('GHOSTX_ROOT_PATH/u')
    expect(env.WSLENV).not.toContain('FABRICA_ROOT_PATH/p')
    expect(env.WSLENV).not.toContain('FABRICA_WORKTREE_PATH/p')
    // The value itself must stay the already-Linux path.
    expect(env.FABRICA_ROOT_PATH).toBe('/home/jin/repo')
    expect(env.FABRICA_WORKTREE_PATH).toBe('/home/jin/repo-worktrees/fix-1')
  })

  it('tags untranslated Windows setup paths /p so WSLENV translates them (wsl.exe shell over a Windows worktree)', () => {
    const env: Record<string, string> = {
      FABRICA_ROOT_PATH: 'C:\\Users\\jin\\repo',
      FABRICA_WORKTREE_PATH: 'C:\\Users\\jin\\repo-worktrees\\fix-1',
      CONDUCTOR_ROOT_PATH: 'C:\\Users\\jin\\repo',
      GHOSTX_ROOT_PATH: 'C:\\Users\\jin\\repo'
    }

    addFABRICAWslInteropEnv(env)

    expect(env.WSLENV).toContain('FABRICA_ROOT_PATH/p')
    expect(env.WSLENV).toContain('FABRICA_WORKTREE_PATH/p')
    expect(env.WSLENV).toContain('CONDUCTOR_ROOT_PATH/p')
    expect(env.WSLENV).toContain('GHOSTX_ROOT_PATH/p')
    expect(env.WSLENV).not.toContain('FABRICA_ROOT_PATH/u')
    expect(env.WSLENV).not.toContain('FABRICA_WORKTREE_PATH/u')
  })

  it('always tags FABRICA_WORKSPACE_NAME /u because it is a name, not a path', () => {
    const env: Record<string, string> = { FABRICA_WORKSPACE_NAME: 'fix-1' }

    addFABRICAWslInteropEnv(env)

    expect(env.WSLENV).toBe('FABRICA_WORKSPACE_NAME/u')
  })

  it('does not register setup vars that are absent from the env', () => {
    const env: Record<string, string> = { FABRICA_TERMINAL_HANDLE: 'term_wsl' }

    addFABRICAWslInteropEnv(env)

    expect(env.WSLENV).toBe('FABRICA_TERMINAL_HANDLE/u')
  })

  it('marks the WSL hook relay version for import on relay spawn envs', () => {
    const env: Record<string, string> = {
      FABRICA_WSL_HOOK_RELAY_VERSION: '0.1.0+abc'
    }
    addFABRICAWslInteropEnv(env)
    expect(env.WSLENV).toBe('FABRICA_WSL_HOOK_RELAY_VERSION/u')
  })

  it('crosses a guest-side OpenCode config overlay untranslated (/u)', () => {
    const env: Record<string, string> = {
      OPENCODE_CONFIG_DIR: '/home/jin/.FABRICA-relay/opencode-overlays/abc',
      FABRICA_OPENCODE_CONFIG_DIR: '/home/jin/.FABRICA-relay/opencode-overlays/abc'
    }
    addFABRICAWslInteropEnv(env)
    expect(env.WSLENV).toContain('OPENCODE_CONFIG_DIR/u')
    expect(env.WSLENV).toContain('FABRICA_OPENCODE_CONFIG_DIR/u')
    expect(env.WSLENV).not.toContain('OPENCODE_CONFIG_DIR/p')
  })

  it('never crosses a Windows OpenCode config dir into the guest', () => {
    // Why: the relay spawn env spreads process.env and the daemon inherits its
    // own — a /p entry here would deliver C:\... as /mnt/c and in-guest OpenCode
    // would adopt FABRICA's Windows overlay as its config root.
    const env: Record<string, string> = {
      OPENCODE_CONFIG_DIR: 'C:\\Users\\jin\\AppData\\Roaming\\FABRICA\\opencode-overlays\\abc',
      FABRICA_OPENCODE_CONFIG_DIR: 'C:\\Users\\jin\\AppData\\Roaming\\FABRICA\\opencode-overlays\\abc'
    }
    addFABRICAWslInteropEnv(env)
    expect(env.WSLENV).not.toContain('OPENCODE_CONFIG_DIR')
    expect(env.WSLENV).not.toContain('FABRICA_OPENCODE_CONFIG_DIR')
  })

  it('does not register the OpenCode config vars when they are absent', () => {
    const env: Record<string, string> = { FABRICA_TERMINAL_HANDLE: 'term_wsl' }
    addFABRICAWslInteropEnv(env)
    expect(env.WSLENV).not.toContain('OPENCODE_CONFIG_DIR')
    expect(env.WSLENV).not.toContain('FABRICA_OPENCODE_CONFIG_DIR')
  })
})

describe('addWorktreeSetupWslInteropEnv', () => {
  it('registers only setup vars, sharing the /u-vs-/p flag logic with the PTY path (#9206)', () => {
    const env: Record<string, string | undefined> = {
      FABRICA_ROOT_PATH: '/mnt/c/Users/jin/repo',
      FABRICA_WORKTREE_PATH: 'C:\\Users\\jin\\repo-worktrees\\fix-1',
      FABRICA_WORKSPACE_NAME: 'fix-1',
      // Terminal-only vars must not leak into runHook's WSLENV.
      FABRICA_TERMINAL_HANDLE: 'term_wsl'
    }

    addWorktreeSetupWslInteropEnv(env)

    expect(env.WSLENV).toBe('FABRICA_ROOT_PATH/u:FABRICA_WORKTREE_PATH/p:FABRICA_WORKSPACE_NAME/u')
  })
})
