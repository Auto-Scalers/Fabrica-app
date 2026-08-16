export function quotePosixShell(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`
}

export function escapeWslShCommandForWindows(command: string): string {
  // WSL preprocesses unescaped $ in Windows argv before the WSL-side shell
  // sees it, even when the POSIX script text would single-quote the dollar.
  let escaped = ''
  for (let index = 0; index < command.length; index += 1) {
    const char = command[index]
    if (char === '$' && command[index - 1] !== '\\') {
      escaped += '\\$'
      continue
    }
    escaped += char
  }
  return escaped
}

export function buildWslLoginShellCommand(command: string): string {
  const quotedCommand = quotePosixShell(command)
  return [
    '_FABRICA_wsl_shell=$(getent passwd "$(id -un)" 2>/dev/null | cut -d: -f7)',
    'if [ -z "$_FABRICA_wsl_shell" ] || [ ! -x "$_FABRICA_wsl_shell" ]; then',
    '  _FABRICA_wsl_shell="${SHELL:-/bin/bash}"',
    'fi',
    'if [ -z "$_FABRICA_wsl_shell" ] || [ ! -x "$_FABRICA_wsl_shell" ]; then',
    '  _FABRICA_wsl_shell=/bin/sh',
    'fi',
    '_FABRICA_wsl_shell_name=$(basename "$_FABRICA_wsl_shell" | tr "[:upper:]" "[:lower:]")',
    'case "$_FABRICA_wsl_shell_name" in',
    `  sh|dash) exec "$_FABRICA_wsl_shell" -lc ${quotedCommand} ;;`,
    `  bash|zsh|ksh|mksh|ash) exec "$_FABRICA_wsl_shell" -ilc ${quotedCommand} ;;`,
    `  *) exec /bin/sh -lc ${quotedCommand} ;;`,
    'esac'
  ].join('\n')
}

export function buildWslInteractiveLoginShellCommand(): string {
  return [
    '_FABRICA_wsl_shell=$(getent passwd "$(id -un)" 2>/dev/null | cut -d: -f7)',
    'if [ -z "$_FABRICA_wsl_shell" ] || [ ! -x "$_FABRICA_wsl_shell" ]; then',
    '  _FABRICA_wsl_shell="${SHELL:-/bin/bash}"',
    'fi',
    'if [ -z "$_FABRICA_wsl_shell" ] || [ ! -x "$_FABRICA_wsl_shell" ]; then',
    '  _FABRICA_wsl_shell=/bin/sh',
    'fi',
    '_FABRICA_shell_ready_root=""',
    'if [ -n "${FABRICA_USER_DATA_PATH:-}" ]; then',
    '  _FABRICA_shell_ready_root="${FABRICA_USER_DATA_PATH%/}/shell-ready"',
    'fi',
    '_FABRICA_wsl_shell_name=$(basename "$_FABRICA_wsl_shell" | tr "[:upper:]" "[:lower:]")',
    'case "$_FABRICA_wsl_shell_name" in',
    '  bash)',
    '    if [ -n "${_FABRICA_shell_ready_root:-}" ] && [ -f "${_FABRICA_shell_ready_root}/bash/rcfile" ]; then',
    '      exec "$_FABRICA_wsl_shell" --rcfile "${_FABRICA_shell_ready_root}/bash/rcfile"',
    '    fi',
    '    ;;',
    '  zsh)',
    '    if [ -n "${_FABRICA_shell_ready_root:-}" ] && [ -d "${_FABRICA_shell_ready_root}/zsh" ]; then',
    '      export ZDOTDIR="${_FABRICA_shell_ready_root}/zsh"',
    '    fi',
    '    ;;',
    'esac',
    'exec "$_FABRICA_wsl_shell" -l'
  ].join('\n')
}
