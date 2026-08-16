const MANAGED_MARKER = '# Fabrica managed WSL CLI launcher'
const BRIDGE_MANAGED_MARKER = '# Fabrica managed WSL CLI PowerShell bridge'

export function buildWslLauncher(
  windowsLauncherPath: string,
  bridgePath = '${XDG_DATA_HOME:-$HOME/.local/share}/fabrica/fabrica-wsl-bridge.ps1'
): string {
  const encodedTarget = Buffer.from(windowsLauncherPath, 'utf8').toString('base64')
  return `#!/usr/bin/env bash
set -euo pipefail
${MANAGED_MARKER}
# FABRICA_WIN_LAUNCHER_B64=${encodedTarget}
FABRICA_WIN_LAUNCHER=${quoteShell(windowsLauncherPath)}
FABRICA_BRIDGE_PS1=${quoteShell(bridgePath)}
if command -v powershell.exe >/dev/null 2>&1; then
  FABRICA_POWERSHELL=powershell.exe
elif [ -x /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe ]; then
  FABRICA_POWERSHELL=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe
else
  echo "Fabrica WSL CLI requires Windows interop and could not find powershell.exe." >&2
  exit 1
fi
# Why: a shell can outlive a deleted worktree; keep explicit CLI selectors and
# help usable, and repair cwd before any WSL interop tool tries to resolve it.
FABRICA_WSL_CWD=$(pwd -P 2>/dev/null) || {
  FABRICA_WSL_CWD=/
  cd /
}
FABRICA_BRIDGE_PS1_WIN=$(wslpath -w "$FABRICA_BRIDGE_PS1")
FABRICA_WSL_CWD_WIN=$(wslpath -w "$FABRICA_WSL_CWD")
exec "$FABRICA_POWERSHELL" -NoProfile -ExecutionPolicy Bypass -File "$FABRICA_BRIDGE_PS1_WIN" "$FABRICA_WIN_LAUNCHER" -WslCwd "$FABRICA_WSL_CWD_WIN" "$@"
`
}

export function buildWslBridgeScript(): string {
  return `${BRIDGE_MANAGED_MARKER}
[CmdletBinding(PositionalBinding=$false)]
param(
  [Parameter(Mandatory=$true, Position=0)]
  [string]$FABRICALauncher,

  [string]$WslCwd,

  [Parameter(ValueFromRemainingArguments=$true)]
  [string[]]$ForwardArgs
)

$exitCode = 0
try {
  if ([string]::IsNullOrEmpty($WslCwd)) {
    Remove-Item Env:FABRICA_CLI_CWD -ErrorAction SilentlyContinue
  } else {
    $env:FABRICA_CLI_CWD = $WslCwd
  }
  Push-Location -LiteralPath (Split-Path -Parent $FABRICALauncher)
  & $FABRICALauncher @ForwardArgs
  if ($null -eq $LASTEXITCODE) {
    if (-not $?) {
      $exitCode = 1
    } else {
      $exitCode = 0
    }
  } else {
    $exitCode = $LASTEXITCODE
  }
} catch {
  Write-Error $_
  $exitCode = 1
}
exit $exitCode
`
}

export function getBridgePathFromCommandPath(commandPath: string): string {
  // Why: both the current Linux command and the legacy pre-rename command
  // share one WSL bridge under ~/.local/share/fabrica.
  return `${commandPath.replace(/\/\.local\/bin\/(?:FABRICA|FABRICA-ide|fabrica)$/, '/.local/share/fabrica')}/fabrica-wsl-bridge.ps1`
}

export function buildSafeReplaceGuard(path: string, managedMarker: string): string {
  const quotedPath = quoteShell(path)
  const quotedMarker = quoteShell(managedMarker)
  return [
    `if [ -L ${quotedPath} ]; then`,
    '  echo "__FABRICA_CONFLICT__"',
    '  exit 23',
    `elif [ -e ${quotedPath} ] && { [ ! -f ${quotedPath} ] || ! grep -Fq ${quotedMarker} ${quotedPath}; }; then`,
    '  echo "__FABRICA_CONFLICT__"',
    '  exit 23',
    'fi'
  ].join('\n')
}

export function buildRegistrationLockPrelude(commandPath: string): string {
  const lockDir = getPosixDirname(getBridgePathFromCommandPath(commandPath))
  // Why: the per-distro queue only serializes one FABRICA process; flock covers
  // a second install (e.g. stable + nightly) mutating the same distro files.
  return [
    `if command -v flock >/dev/null 2>&1 && mkdir -p ${quoteShell(lockDir)} 2>/dev/null; then`,
    `  exec 9>${quoteShell(`${lockDir}/.FABRICA-wsl-cli.lock`)}`,
    '  flock -x -w 30 9',
    'fi'
  ].join('\n')
}

export function buildManagedLegacyRemoveCommand(quotedLegacyCommandPath: string): string {
  // Why: remove only the FABRICA-managed pre-rename wrapper; user-owned `FABRICA`
  // commands and symlinks must survive.
  return `if [ ! -L ${quotedLegacyCommandPath} ] && [ -f ${quotedLegacyCommandPath} ] && grep -Fq ${quoteShell(MANAGED_MARKER)} ${quotedLegacyCommandPath}; then rm -f ${quotedLegacyCommandPath}; fi`
}

export function buildSafeRemoveCommand(commandPath: string, legacyCommandPath?: string): string {
  const bridgePath = getBridgePathFromCommandPath(commandPath)
  return [
    'set -euo pipefail',
    buildRegistrationLockPrelude(commandPath),
    buildSafeReplaceGuard(commandPath, MANAGED_MARKER),
    buildSafeReplaceGuard(bridgePath, BRIDGE_MANAGED_MARKER),
    `rm -f ${quoteShell(commandPath)} ${quoteShell(bridgePath)}`,
    // Why: leaving a managed legacy `FABRICA` behind lets startup reconciliation
    // re-adopt it as opt-in proof and silently undo this removal.
    ...(legacyCommandPath ? [buildManagedLegacyRemoveCommand(quoteShell(legacyCommandPath))] : [])
  ].join('\n')
}

export function parseManagedLauncherTarget(content: string): string | null {
  const encoded = content.match(/^# FABRICA_WIN_LAUNCHER_B64=([A-Za-z0-9+/=]+)$/m)?.[1]
  if (encoded) {
    try {
      return Buffer.from(encoded, 'base64').toString('utf8')
    } catch {
      return null
    }
  }

  const legacyTarget = content.match(/^FABRICA_WIN_LAUNCHER='((?:[^']|'"'"')*)'$/m)?.[1]
  return legacyTarget ? legacyTarget.replaceAll(`'"'"'`, "'") : null
}

export function getPosixDirname(path: string): string {
  return path.slice(0, path.lastIndexOf('/')) || '/'
}

export function getWslLauncherMarker(): string {
  return MANAGED_MARKER
}

export function getWslBridgeMarker(): string {
  return BRIDGE_MANAGED_MARKER
}

export function quoteShell(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`
}
