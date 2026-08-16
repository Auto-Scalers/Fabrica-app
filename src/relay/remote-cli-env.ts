export function pickRemoteCliEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  const picked: Record<string, string> = {}
  for (const key of [
    'FABRICA_TERMINAL_HANDLE',
    'FABRICA_WORKTREE_ID',
    'FABRICA_PANE_KEY',
    'FABRICA_AGENT_LAUNCH_TOKEN',
    'FABRICA_WORKSPACE_ID',
    'FABRICA_USER_DATA_PATH',
    'PATH',
    'Path'
  ]) {
    const value = env[key]
    if (typeof value === 'string') {
      picked[key] = value
    }
  }
  return picked
}
