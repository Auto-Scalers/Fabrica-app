import type { CommandSpec } from '../args'
import { GLOBAL_FLAGS } from '../args'

export const ENVIRONMENT_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['environment', 'add'],
    summary: 'Save a remote FABRICA runtime environment from a pairing code',
    usage: 'fabrica environment add --name <name> --pairing-code <code> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'name'],
    examples: ['fabrica environment add --name work-laptop --pairing-code FABRICA://pair?code=...']
  },
  {
    path: ['environment', 'list'],
    summary: 'List saved FABRICA runtime environments',
    usage: 'fabrica environment list [--json]',
    allowedFlags: [...GLOBAL_FLAGS]
  },
  {
    path: ['environment', 'show'],
    summary: 'Show one saved FABRICA runtime environment',
    usage: 'fabrica environment show --environment <selector> [--json]',
    allowedFlags: [...GLOBAL_FLAGS]
  },
  {
    path: ['environment', 'rm'],
    destructive: true,
    summary: 'Remove one saved FABRICA runtime environment',
    usage: 'fabrica environment rm --environment <selector> [--json]',
    allowedFlags: [...GLOBAL_FLAGS]
  }
]
