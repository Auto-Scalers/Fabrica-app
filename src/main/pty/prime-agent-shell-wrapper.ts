import { wslHookRelayEndpointFilePath } from '../../shared/wsl-hook-relay-contract'

const PRIME_AGENT_SUBCOMMANDS = [
  'agents',
  'config',
  'doctor',
  'help',
  'list',
  'model',
  'package',
  'rename',
  'schedule',
  'send',
  'session',
  'shutdown',
  'status',
  'stop',
  'update'
] as const

export function getPosixPrimeAgentShellWrapper(): string {
  const subcommands = PRIME_AGENT_SUBCOMMANDS.join('|')
  const guestEndpointPath = wslHookRelayEndpointFilePath('${HOME%/}', '${FABRICA_WSL_HOOK_INSTANCE}')
  return `# Why: WSL cannot install into Prime's guest-owned config root from the
# Windows host, so pass FABRICA's status extension only to interactive launches.
if [[ -n "\${FABRICA_PRIME_AGENT_STATUS_EXTENSION:-}" ]]; then
  __FABRICA_prime_agent_should_skip_extension() {
    if [[ "\${1:-}" == "--daemon-socket" && ( "\${3:-}" == "stop" || "\${3:-}" == "rename" ) ]]; then
      return 0
    fi
    if [[ "\${1:-}" == --daemon-socket=* && ( "\${2:-}" == "stop" || "\${2:-}" == "rename" ) ]]; then
      return 0
    fi
    case "\${1:-}" in
      help|--help|-h|--version|-v|--extension|--extension=*) return 0 ;;
      ${subcommands}) return 0 ;;
    esac
    return 1
  }
  __FABRICA_prime_agent_has_explicit_extension() {
    local __FABRICA_arg
    for __FABRICA_arg in "$@"; do
      case "$__FABRICA_arg" in
        --extension|--extension=*) return 0 ;;
      esac
    done
    return 1
  }
  __FABRICA_prime_agent() {
    if [[ "\${1:-}" == "attach" && ( -z "\${2:-}" || "\${2:-}" == -* ) ]]; then
      command prime-agent "$@"
      return
    fi
    if ! __FABRICA_prime_agent_should_skip_extension "$@" && ! __FABRICA_prime_agent_has_explicit_extension "$@" && [[ -f "\${FABRICA_PRIME_AGENT_STATUS_EXTENSION}" ]]; then
      local __FABRICA_guest_endpoint="${guestEndpointPath}"
      if [[ -n "\${HOME:-}" && -n "\${FABRICA_WSL_HOOK_INSTANCE:-}" ]]; then
        local FABRICA_AGENT_HOOK_ENDPOINT="$__FABRICA_guest_endpoint"
        export FABRICA_AGENT_HOOK_ENDPOINT
      fi
      if [[ "\${1:-}" == "attach" && -n "\${2:-}" && "\${2:-}" != -* ]]; then
        local __FABRICA_attach_agent="$2"
        shift 2
        command prime-agent attach "$__FABRICA_attach_agent" --extension "\${FABRICA_PRIME_AGENT_STATUS_EXTENSION}" "$@"
      else
        command prime-agent --extension "\${FABRICA_PRIME_AGENT_STATUS_EXTENSION}" "$@"
      fi
    else
      command prime-agent "$@"
    fi
  }
  prime-agent() { __FABRICA_prime_agent "$@"; }
fi
`
}
