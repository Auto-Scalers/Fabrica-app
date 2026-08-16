import type { CommandSpec } from '../args'
import { GLOBAL_FLAGS } from '../args'

export const AGENT_HOOK_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['agent', 'hooks', 'status'],
    summary: 'Show whether FABRICA-managed agent status hooks are enabled',
    usage: 'fabrica agent hooks status [--json]',
    allowedFlags: [...GLOBAL_FLAGS],
    examples: ['fabrica agent hooks status', 'fabrica agent hooks status --json']
  },
  {
    path: ['agent', 'hooks', 'off'],
    summary: 'Disable FABRICA-managed agent status hooks and remove local hook entries',
    usage: 'fabrica agent hooks off [--json]',
    allowedFlags: [...GLOBAL_FLAGS],
    examples: ['fabrica agent hooks off']
  },
  {
    path: ['agent', 'hooks', 'on'],
    summary: 'Enable FABRICA-managed agent status hooks',
    usage: 'fabrica agent hooks on [--json]',
    allowedFlags: [...GLOBAL_FLAGS],
    examples: ['fabrica agent hooks on']
  }
]
