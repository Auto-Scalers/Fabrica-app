// Why: local PTYs and the daemon/SSH path must use identical ZDOTDIR discovery;
// small drift here breaks different terminal transports in different ways.

function quotePosixSingle(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

export function getZshEnvTemplate(zshDir: string, headerPrefix = ''): string {
  const header = headerPrefix
    ? `FABRICA ${headerPrefix} zsh shell-ready wrapper`
    : 'FABRICA zsh shell-ready wrapper'
  return `# ${header}
# Why: capture the runtime wrapper dir before it is unset below. On WSL this
# file is generated with a Windows path but sourced via /mnt/c, so the baked
# literal is unusable there and ZDOTDIR must be restored from this value.
# Derive it from the file being sourced (%x, zsh's internal script name) rather
# than the env-imported $ZDOTDIR: zsh corrupts environment values whose UTF-8
# bytes fall in its 0x84-0x9D token range (e.g. a non-ASCII Windows username
# such as a Korean login), which would make the self-check below fail and fall
# back to the unusable baked literal, so the user's .zshrc never loads (#8003).
# %x is not subject to that corruption; keep $ZDOTDIR as a fallback for the
# rare shell where %x prompt expansion yields nothing.
_FABRICA_wrapper_zdotdir_self="\${\${(%):-%x}:h}"
if [[ -z "\${_FABRICA_wrapper_zdotdir_self:-}" ]]; then
  _FABRICA_wrapper_zdotdir_self="\${ZDOTDIR:-}"
fi
while [[ "\${_FABRICA_wrapper_zdotdir_self:-}" == */ ]]; do
  _FABRICA_wrapper_zdotdir_self="\${_FABRICA_wrapper_zdotdir_self%/}"
done
_FABRICA_spawn_orig_zdotdir="\${FABRICA_ORIG_ZDOTDIR:-}"
_FABRICA_user_zdotdir="\${_FABRICA_spawn_orig_zdotdir:-$HOME}"
_FABRICA_zshenv_source_dir="\${FABRICA_ZSHENV_SOURCE_DIR:-$HOME}"
_FABRICA_zshenv_path=""
unset FABRICA_ZSHENV_SOURCE_DIR

# Normalize fallback and source roots before reading user .zshenv so nested
# FABRICA PTYs never source another FABRICA wrapper recursively.
while [[ "\${_FABRICA_user_zdotdir}" == */ ]]; do
  _FABRICA_user_zdotdir="\${_FABRICA_user_zdotdir%/}"
done
case "\${_FABRICA_user_zdotdir}" in
  ""|*/shell-ready/zsh) _FABRICA_user_zdotdir="$HOME" ;;
esac
while [[ "\${_FABRICA_zshenv_source_dir}" == */ ]]; do
  _FABRICA_zshenv_source_dir="\${_FABRICA_zshenv_source_dir%/}"
done
case "\${_FABRICA_zshenv_source_dir}" in
  ""|*/shell-ready/zsh) _FABRICA_zshenv_source_dir="$HOME" ;;
esac

# Why: source at wrapper top level, not in a function/subshell, so .zshenv
# exports, functions, path/fpath typesets, and zsh options keep normal scope.
unset ZDOTDIR
if [[ -n "\${_FABRICA_zshenv_source_dir:-}" && -f "\${_FABRICA_zshenv_source_dir}/.zshenv" ]]; then
  _FABRICA_zshenv_path="\${_FABRICA_zshenv_source_dir}/.zshenv"
fi
if [[ -n "\${_FABRICA_zshenv_path:-}" ]]; then
  source "\${_FABRICA_zshenv_path}"
fi

_FABRICA_discovered_zdotdir="\${ZDOTDIR:-}"

while [[ "\${_FABRICA_discovered_zdotdir}" == */ ]]; do
  _FABRICA_discovered_zdotdir="\${_FABRICA_discovered_zdotdir%/}"
done

case "\${_FABRICA_discovered_zdotdir}" in
  *[![:space:]]*) ;;
  *) _FABRICA_discovered_zdotdir="" ;;
esac

if [[ -n "\${_FABRICA_discovered_zdotdir}" && ! -d "\${_FABRICA_discovered_zdotdir}" ]]; then
  [[ "\${FABRICA_DEBUG:-0}" == "1" ]] && echo "[FABRICA-shell-ready] Discovered ZDOTDIR '\${_FABRICA_discovered_zdotdir}' does not exist, falling back" >&2
  _FABRICA_discovered_zdotdir=""
fi

export FABRICA_ORIG_ZDOTDIR="\${_FABRICA_discovered_zdotdir:-\${_FABRICA_user_zdotdir:-$HOME}}"

while [[ "\${FABRICA_ORIG_ZDOTDIR}" == */ ]]; do
  FABRICA_ORIG_ZDOTDIR="\${FABRICA_ORIG_ZDOTDIR%/}"
done

case "\${FABRICA_ORIG_ZDOTDIR}" in
  ""|*/shell-ready/zsh) export FABRICA_ORIG_ZDOTDIR="$HOME" ;;
esac

# Why: use :- after user .zshenv — a pathological unset under set -u must not
# abort the wrapper; empty falls through to the baked-literal branch.
if [[ -n "\${_FABRICA_wrapper_zdotdir_self:-}" && -f "\${_FABRICA_wrapper_zdotdir_self:-}/.zshenv" ]]; then
  export ZDOTDIR="\${_FABRICA_wrapper_zdotdir_self:-}"
else
  export ZDOTDIR=${quotePosixSingle(zshDir)}
fi
unset _FABRICA_spawn_orig_zdotdir _FABRICA_user_zdotdir _FABRICA_zshenv_source_dir _FABRICA_zshenv_path _FABRICA_discovered_zdotdir _FABRICA_wrapper_zdotdir_self
`
}

export function getZshStartupFileSourceBlock(options: {
  fileName: '.zprofile' | '.zshrc' | '.zlogin'
  homeExpression?: string
  interactiveOnly?: boolean
  skipWhenHomeIsCurrentZdotdir?: boolean
}): string {
  const homeExpression = options.homeExpression ?? '"${FABRICA_ORIG_ZDOTDIR:-$HOME}"'
  const checks = [
    options.skipWhenHomeIsCurrentZdotdir ? '"$_FABRICA_home" != "$ZDOTDIR"' : null,
    options.interactiveOnly ? '-o interactive' : null,
    `-f "$_FABRICA_home/${options.fileName}"`
  ].filter(Boolean)

  return `_FABRICA_home=${homeExpression}
case "\${_FABRICA_home%/}" in
  */shell-ready/zsh) _FABRICA_home="$HOME" ;;
esac
if [[ ${checks.join(' && ')} ]]; then
  _FABRICA_wrapper_zdotdir="$ZDOTDIR"
  # Why: user startup files resolve plugin/config paths from their own ZDOTDIR;
  # FABRICA restores its wrapper dir afterward so zsh still loads wrapper files.
  export ZDOTDIR="$_FABRICA_home"
  source "$_FABRICA_home/${options.fileName}"
  export ZDOTDIR="$_FABRICA_wrapper_zdotdir"
  unset _FABRICA_wrapper_zdotdir
fi
`
}

// Why: zsh precmd fires before zle switches the PTY into line-editing mode,
// so the marker must be emitted from zle-line-init. Registering it through
// add-zle-hook-widget is unsafe: the azhw dispatcher aborts its hook chain
// when an earlier hook exits non-zero, and a pre-existing raw user widget
// (e.g. oh-my-zsh vi-mode without VI_MODE_SET_CURSOR) is preserved as the
// first hook and fails — silently suppressing the marker and stalling every
// startup command on the pre-ready timeout. Instead, own zle-line-init: emit
// the marker first, then chain to whatever widget was installed before.
export function getZshShellReadyMarkerRegistrationBlock(escapedMarker: string): string {
  return `if [[ "\${FABRICA_SHELL_READY_MARKER:-0}" == "1" ]]; then
  # Why: capture the prior zle-line-init so the marker chains to it. On a
  # re-source we are already the bound widget, so keep the function captured
  # the first time instead of clobbering it to empty (which would silently
  # drop the user's widget on every prompt after the second source). Only
  # user-defined widgets are chainable as plain functions; builtin/completion
  # forms (rare for zle-line-init) are left unchained.
  if [[ "\${widgets[zle-line-init]:-}" == "user:__FABRICA_prompt_mark" ]]; then
    :
  elif (( \${+widgets[zle-line-init]} )) && [[ "\${widgets[zle-line-init]}" == user:* ]]; then
    __FABRICA_prev_line_init_fn="\${widgets[zle-line-init]#user:}"
  else
    __FABRICA_prev_line_init_fn=""
  fi
  __FABRICA_prompt_mark() {
    printf "${escapedMarker}"
    # Why: call the prior hook as a plain function, not an aliased widget, so
    # $WIDGET stays zle-line-init for add-zle-hook-widget dispatchers.
    if [[ -n "\${__FABRICA_prev_line_init_fn:-}" ]]; then
      "\${__FABRICA_prev_line_init_fn}" "$@"
    fi
  }
  zle -N zle-line-init __FABRICA_prompt_mark
fi
`
}

// Why: fish has no ZDOTDIR-style wrapper dir, so the marker rides `--init-command`
// and fires on fish_prompt — the earliest event fish exposes (STA-3417). Unlike zsh's
// zle-line-init this lands just *before* fish arms `?2004h`, which PostReadyFlushGate
// absorbs. `builtin printf` so a user-defined printf can't silently swallow the marker
// and send every launch to the ready timeout.
export function getFishShellReadyInitCommand(escapedMarker: string): string {
  return `if test "$FABRICA_SHELL_READY_MARKER" = 1
  function __FABRICA_shell_ready_marker --on-event fish_prompt
    builtin printf "${escapedMarker}"
    functions -e __FABRICA_shell_ready_marker
  end
end`
}

export function getZshFinalZdotdirRestoreBlock(homeExpression = '"${FABRICA_ORIG_ZDOTDIR:-$HOME}"') {
  return `_FABRICA_home=${homeExpression}
case "\${_FABRICA_home%/}" in
  */shell-ready/zsh) _FABRICA_home="$HOME" ;;
esac
# Why: after FABRICA's last wrapper file has loaded, the interactive shell should
# expose the same ZDOTDIR a normal zsh startup would expose.
export ZDOTDIR="$_FABRICA_home"
unset _FABRICA_home
`
}
