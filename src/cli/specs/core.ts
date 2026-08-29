import type { CommandSpec } from '../args'
import { GLOBAL_FLAGS } from '../args'
import { SERVE_COMMAND_SPECS } from './serve'

export const CORE_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['open'],
    summary: 'Launch Fabrica and wait for the runtime to be reachable',
    usage: 'fabrica open [--json]',
    allowedFlags: [...GLOBAL_FLAGS],
    examples: ['fabrica open', 'fabrica open --json']
  },
  ...SERVE_COMMAND_SPECS,
  {
    path: ['status'],
    summary: 'Show app/runtime/graph readiness',
    usage: 'fabrica status [--json]',
    allowedFlags: [...GLOBAL_FLAGS],
    examples: ['fabrica status', 'fabrica status --json']
  },
  {
    path: ['claude-teams'],
    argumentMode: 'passthrough',
    summary: 'Start Claude Code Agent Teams in the current Fabrica terminal',
    usage: 'fabrica claude-teams [claude args...]',
    allowedFlags: [...GLOBAL_FLAGS],
    notes: [
      'Passes all following arguments through to Claude Code after enabling Agent Teams native panes.',
      'Must be run from inside a Fabrica terminal. Starts Claude Code Agent Teams in the current pane and opens teammates as native Fabrica splits.'
    ],
    examples: ['fabrica claude-teams', 'fabrica claude-teams --resume <session-id>']
  },
  {
    path: ['repo', 'list'],
    summary: 'List repos registered in Fabrica',
    usage: 'fabrica repo list [--json]',
    allowedFlags: [...GLOBAL_FLAGS]
  },
  {
    path: ['repo', 'add'],
    summary: 'Add a project to Fabrica by filesystem path',
    usage: 'fabrica repo add --path <path> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'path']
  },
  {
    path: ['repo', 'show'],
    summary: 'Show one registered repo',
    usage: 'fabrica repo show --repo <selector> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'repo']
  },
  {
    path: ['repo', 'set-base-ref'],
    summary: "Set the repo's default base ref for future worktrees",
    usage: 'fabrica repo set-base-ref --repo <selector> --ref <ref> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'repo', 'ref']
  },
  {
    path: ['repo', 'search-refs'],
    summary: 'Search branch/tag refs within a repo',
    usage: 'fabrica repo search-refs --repo <selector> --query <text> [--limit <n>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'repo', 'query', 'limit']
  },
  {
    path: ['worktree', 'list'],
    summary: 'List Fabrica-managed worktrees',
    usage: 'fabrica worktree list [--repo <selector>] [--limit <n>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'repo', 'limit']
  },
  {
    path: ['worktree', 'show'],
    summary: 'Show one worktree',
    usage: 'fabrica worktree show --worktree <selector> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'worktree']
  },
  {
    path: ['worktree', 'current'],
    summary: 'Show the Fabrica-managed worktree for the current directory',
    usage: 'fabrica worktree current [--json]',
    allowedFlags: [...GLOBAL_FLAGS],
    notes: [
      'Resolves the current shell directory to a path: selector so agents can target the enclosing Fabrica worktree without spelling out $PWD.'
    ],
    examples: ['fabrica worktree current', 'fabrica worktree current --json']
  },
  {
    path: ['worktree', 'create'],
    summary: 'Create a new Fabrica-managed worktree',
    usage:
      'fabrica worktree create --name <name> [--repo <selector>|--project <id> [--host <host-id>]|--project-host-setup <id>] [--agent <id>] [--prompt <text>] [--setup run|skip|inherit] [--base-branch <ref>] [--issue <number>] [--linear-issue <identifier-or-url>] [--comment <text>] [--parent-worktree <selector>] [--no-parent] [--run-hooks] [--activate] [--json]',
    allowedFlags: [
      ...GLOBAL_FLAGS,
      'repo',
      'project',
      'host',
      'project-host-setup',
      'name',
      'agent',
      'prompt',
      'base-branch',
      'issue',
      'linear-issue',
      'comment',
      'setup',
      'parent-worktree',
      'no-parent',
      'run-hooks',
      'activate'
    ],
    notes: [
      'This creates a new checkout. For a fresh agent in an existing worktree, use `fabrica terminal create --worktree active --command "codex"` instead.',
      'By default, Fabrica records the new worktree as a child of the caller context when it can infer one from the Fabrica terminal or current directory.',
      'If --repo is omitted, Fabrica infers the repo from the current Fabrica-managed worktree.',
      'Use --project with --host to create on a ready project host setup without spelling the backing repo id.',
      'For related work, use the inferred parent or pass --parent-worktree active, folder:<id>, or worktree:<worktreeId> to make the relationship explicit. Worktree ids are the full <repo-id>::<path> values returned by `fabrica worktree list --json`.',
      'Use --no-parent when the new worktree should be independent of the current context.',
      '--no-parent only affects Fabrica lineage; omit --base-branch to use the repo default base, or pass the default base ref explicitly for independent top-level work.',
      'By default this creates the worktree and its first terminal without switching the active Fabrica view.',
      'Pass --agent to launch an agent in the first terminal; --prompt sends initial work to that agent.',
      'With --agent --json, read the new agent handle from result.agentTerminalHandle; older runtimes return only result.startupTerminal.handle, and may return neither for folder-based repos.',
      'Repo-defined setup hooks follow the repository setup policy; pass --setup run to force them.',
      'Pass --activate when the CLI caller intentionally wants to reveal the new worktree in the app.',
      'Passing --run-hooks is kept as a legacy alias for --setup run and reveals the worktree.'
    ],
    examples: [
      'fabrica worktree create --name agent-task --agent codex --prompt "hi" --json',
      'fabrica worktree create --repo id:<repoId> --name related-task --json',
      'fabrica worktree create --project github:Auto-Scalers/Fabrica-app --host runtime:gpu --name benchmark --json',
      'fabrica worktree create --repo id:<repoId> --name linear-task --linear-issue https://linear.app/stably/issue/STA-335/test-issue --json',
      'fabrica worktree create --repo id:<repoId> --name agent-task --agent codex --prompt "hi" --json',
      'fabrica worktree create --repo id:<repoId> --name folder-child --parent-worktree folder:<folderId> --json',
      'fabrica worktree create --repo id:<repoId> --name related-task --parent-worktree active --json',
      'fabrica worktree create --repo id:<repoId> --name independent-task --no-parent --json'
    ]
  },
  {
    path: ['worktree', 'set'],
    summary: 'Update Fabrica metadata for a worktree',
    usage:
      'fabrica worktree set --worktree <selector> [--display-name <name>] [--issue <number|null>] [--linear-issue <identifier-or-url|null>] [--comment <text>] [--workspace-status <id>] [--parent-worktree <selector>|--no-parent] [--json]',
    allowedFlags: [
      ...GLOBAL_FLAGS,
      'worktree',
      'display-name',
      'issue',
      'linear-issue',
      'comment',
      'workspace-status',
      'parent-worktree',
      'no-parent'
    ],
    notes: [
      'Workspace status ids match the board columns (defaults: todo, in-progress, in-review, completed); custom statuses use their configured id.',
      'Pass --linear-issue null to clear the Linear issue link.'
    ],
    examples: [
      'fabrica worktree set --worktree active --linear-issue STA-335 --json',
      'fabrica worktree set --worktree active --linear-issue null --json'
    ]
  },
  {
    path: ['worktree', 'rm'],
    // Why: agents reach for git's `remove`/`delete` verbs; accept them as
    // aliases so a conventional guess resolves instead of dead-ending.
    aliases: [
      ['worktree', 'remove'],
      ['worktree', 'delete']
    ],
    destructive: true,
    summary: 'Remove a worktree from Fabrica and git',
    usage: 'fabrica worktree rm --worktree <selector> [--force] [--run-hooks] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'worktree', 'force', 'run-hooks'],
    notes: ['Repo-defined FABRICA.yaml archive hooks are skipped unless --run-hooks is passed.']
  },
  {
    path: ['worktree', 'ps'],
    summary: 'Show a compact orchestration summary across worktrees',
    usage: 'fabrica worktree ps [--limit <n>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'limit']
  },
  {
    path: ['terminal', 'list'],
    summary: 'List live Fabrica-managed terminals',
    usage:
      'fabrica terminal list [--worktree <selector>] [--limit <n>] [--include-visual-layouts] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'worktree', 'limit', 'include-visual-layouts'],
    notes: [
      'JSON omits visualLayouts by default; pass --include-visual-layouts when machine-readable tab and pane topology is required.'
    ]
  },
  {
    path: ['terminal', 'show'],
    summary: 'Show terminal metadata and preview',
    usage: 'fabrica terminal show [--terminal <handle>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'terminal']
  },
  {
    path: ['terminal', 'read'],
    summary: 'Read bounded terminal output',
    usage: 'fabrica terminal read [--terminal <handle>] [--cursor <n>] [--limit <n>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'terminal', 'cursor', 'limit'],
    notes: [
      'Omit --terminal to target the active terminal in the current worktree.',
      'Use --cursor with the nextCursor value from a previous read to get only new output since that read.',
      'Use --limit to request more retained lines for long agent responses; output reports oldestCursor when older lines were dropped.',
      'Useful for capturing the response to a command: read before sending, then read --cursor <prev> after waiting.'
    ],
    examples: [
      'fabrica terminal read --json',
      'fabrica terminal read --terminal term_abc123 --cursor 42 --limit 1000 --json'
    ]
  },
  {
    path: ['terminal', 'send'],
    summary: 'Send input to a live terminal',
    usage:
      'fabrica terminal send [--terminal <handle>] [--text <text>] [--enter] [--interrupt] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'terminal', 'text', 'enter', 'interrupt']
  },
  {
    path: ['terminal', 'wait'],
    summary: 'Wait for a terminal condition',
    usage:
      'fabrica terminal wait [--terminal <handle>] --for exit|tui-idle [--timeout-ms <ms>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'terminal', 'for', 'timeout-ms']
  },
  {
    path: ['terminal', 'stop'],
    summary: 'Stop terminals for a worktree',
    usage: 'fabrica terminal stop --worktree <selector> [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'worktree']
  },
  {
    path: ['terminal', 'create'],
    summary: 'Create a terminal session in the current worktree',
    usage:
      'fabrica terminal create [--worktree <selector>] [--title <name>] [--command <text>] [--focus] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'worktree', 'command', 'title', 'focus'],
    notes: [
      'Creates a visible terminal tab without switching focus when possible; falls back to a background handle if the UI cannot adopt it. Pass --focus to switch to it.',
      'Use this, not worktree create, for a fresh agent in the current checkout.'
    ],
    examples: [
      'fabrica terminal create --json',
      'fabrica terminal create --worktree active --command "codex" --json',
      'fabrica terminal create --worktree path:/projects/myapp --title "RUNNER" --command "opencode"',
      'fabrica terminal create --worktree path:/projects/myapp --command "opencode" --focus'
    ]
  },
  {
    path: ['terminal', 'switch'],
    // Why: `focus` is the legacy verb for this action; keep it working as an
    // alias rather than a duplicate spec + handler registration.
    aliases: [['terminal', 'focus']],
    summary: 'Switch to a terminal tab in the UI',
    usage: 'fabrica terminal switch [--terminal <handle>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'terminal'],
    examples: ['fabrica terminal switch --terminal term_abc123']
  },
  {
    path: ['terminal', 'close'],
    summary: 'Close a terminal pane/session, or its whole tab with --tab',
    usage: 'fabrica terminal close [--terminal <handle>] [--tab] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'terminal', 'tab'],
    notes: [
      'Without --tab, preserves the existing pane/session close behavior. With --tab, waits until the whole tab is durably removed.'
    ],
    examples: [
      'fabrica terminal close --terminal term_abc123',
      'fabrica terminal close --terminal term_abc123 --tab --json'
    ]
  },
  {
    path: ['terminal', 'rename'],
    summary: 'Set or clear the title of a terminal tab',
    usage: 'fabrica terminal rename [--terminal <handle>] [--title <text>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'terminal', 'title'],
    notes: ['Omit --title or pass an empty string to reset to the auto-generated title.'],
    examples: [
      'fabrica terminal rename --terminal term_abc123 --title "RUNNER"',
      'fabrica terminal rename --terminal term_abc123 --json'
    ]
  },
  {
    path: ['terminal', 'split'],
    summary: 'Split an existing terminal pane',
    usage:
      'fabrica terminal split [--terminal <handle>] [--direction horizontal|vertical] [--command <text>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'terminal', 'direction', 'command'],
    examples: [
      'fabrica terminal split --terminal term_abc123 --direction horizontal --json',
      'fabrica terminal split --terminal term_abc123 --command "codex"'
    ]
  }
]
