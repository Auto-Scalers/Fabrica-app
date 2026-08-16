#!/bin/bash
# Why: remove the PATH symlink that after-install.sh created, but only if it
# still points into a Fabrica install dir — never delete an unrelated
# /usr/bin/fabrica a user or other package may own.
set -e

link="/usr/bin/fabrica"

if [ -L "$link" ]; then
  target="$(readlink "$link" || true)"
  case "$target" in
    /opt/Fabrica/*|/opt/fabrica/*|/opt/fabrica/*)
      rm -f "$link"
      ;;
  esac
fi

exit 0
