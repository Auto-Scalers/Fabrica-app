import { describe, expect, it } from 'vitest'
import { pickRemoteCliEnv } from './remote-cli-env'

describe('pickRemoteCliEnv', () => {
  it('forwards SSH FABRICA terminal and worktree context for remote CLI calls', () => {
    expect(
      pickRemoteCliEnv({
        FABRICA_TERMINAL_HANDLE: 'term_ssh',
        FABRICA_WORKTREE_ID: 'repo::remote',
        FABRICA_PANE_KEY: 'pane-1',
        FABRICA_AGENT_LAUNCH_TOKEN: 'launch-secret',
        FABRICA_WORKSPACE_ID: 'workspace-1',
        FABRICA_USER_DATA_PATH: '/tmp/FABRICA',
        PATH: '/usr/bin',
        SECRET_TOKEN: 'nope'
      })
    ).toEqual({
      FABRICA_TERMINAL_HANDLE: 'term_ssh',
      FABRICA_WORKTREE_ID: 'repo::remote',
      FABRICA_PANE_KEY: 'pane-1',
      FABRICA_AGENT_LAUNCH_TOKEN: 'launch-secret',
      FABRICA_WORKSPACE_ID: 'workspace-1',
      FABRICA_USER_DATA_PATH: '/tmp/FABRICA',
      PATH: '/usr/bin'
    })
  })
})
