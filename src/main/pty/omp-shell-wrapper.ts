// Why: OMP 15.x discovers built-in user extensions from ~/.omp/agent, but a
// typed `omp` in an existing terminal still needs FABRICA's status extension
// passed explicitly. Do not redirect PI_CODING_AGENT_DIR here: that variable
// is OMP's mutable home, so config/auth/session commands must keep the user's
// normal source of truth.

const OMP_SUBCOMMANDS = [
  '__complete',
  'acp',
  'agents',
  'auth-broker',
  'auth-gateway',
  'bench',
  'commit',
  'completions',
  'config',
  'dry-balance',
  'gallery',
  'grep',
  'grievances',
  'install',
  'join',
  'models',
  'plugin',
  'read',
  'say',
  'search',
  'setup',
  'shell',
  'ssh',
  'stats',
  'tiny-models',
  'token',
  'ttsr',
  'update',
  'usage',
  'worktree',
  'q',
  'wt'
] as const

export function getPosixOmpShellWrapper(): string {
  const subcommands = OMP_SUBCOMMANDS.join('|')
  return `# Why: OMP does not auto-load FABRICA's managed status extension; wrap only
# interactive launch invocations so subcommands such as \`omp config\` keep
# their normal argv shape.
__FABRICA_omp_should_skip_extension() {
  case "\${1:-}" in
    help|--help|-h|--version|-v) return 0 ;;
    ${subcommands}) return 0 ;;
  esac
  return 1
}
__FABRICA_omp() {
  local __FABRICA_use_extension=1
  __FABRICA_omp_should_skip_extension "\${1:-}" && __FABRICA_use_extension=0
  if [[ $__FABRICA_use_extension -eq 1 && -n "\${FABRICA_OMP_STATUS_EXTENSION:-}" && -f "\${FABRICA_OMP_STATUS_EXTENSION}" ]]; then
    if [[ "\${1:-}" == "launch" ]]; then
      shift
      command omp launch --extension "\${FABRICA_OMP_STATUS_EXTENSION}" "$@"
    else
      command omp --extension "\${FABRICA_OMP_STATUS_EXTENSION}" "$@"
    fi
  else
    command omp "$@"
  fi
}
if [[ -n "\${FABRICA_OMP_STATUS_EXTENSION:-}" ]]; then
  omp() { __FABRICA_omp "$@"; }
fi
`
}

export function getPowerShellOmpShellWrapper(): string {
  const subcommands = OMP_SUBCOMMANDS.map((value) => `'${value}'`).join(', ')
  return `# Why: OMP does not auto-load FABRICA's managed status extension; wrap only
# interactive launch invocations so subcommands such as \`omp config\` keep
# their normal argv shape.
function Global:__FABRICAOmpShouldSkipExtension {
    param([string]$Name)
    $skip = @("help", "--help", "-h", "--version", "-v") + @(${subcommands})
    return $skip -contains $Name
}
if ($env:FABRICA_OMP_STATUS_EXTENSION) {
    function Global:omp {
        $FABRICAUseExtension = -not (__FABRICAOmpShouldSkipExtension -Name ([string]($args[0])))
        $FABRICAStatus = 0
        $FABRICACommand = Get-Command omp -CommandType Application,ExternalScript -ErrorAction SilentlyContinue | Select-Object -First 1
        if (-not $FABRICACommand) {
            Write-Error "omp executable not found"
            $FABRICAStatus = 127
        } elseif ($FABRICAUseExtension -and $env:FABRICA_OMP_STATUS_EXTENSION -and
            (Test-Path -LiteralPath $env:FABRICA_OMP_STATUS_EXTENSION)) {
            if ($args.Count -gt 0 -and $args[0] -eq "launch") {
                $FABRICALaunchArgs = @($args | Select-Object -Skip 1)
                & $FABRICACommand.Source launch --extension $env:FABRICA_OMP_STATUS_EXTENSION @FABRICALaunchArgs
            } else {
                & $FABRICACommand.Source --extension $env:FABRICA_OMP_STATUS_EXTENSION @args
            }
            $FABRICAStatus = $LASTEXITCODE
        } else {
            & $FABRICACommand.Source @args
            $FABRICAStatus = $LASTEXITCODE
        }

        $global:LASTEXITCODE = $FABRICAStatus
    }
}
`
}
