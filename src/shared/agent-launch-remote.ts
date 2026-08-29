/**
 * Why: a repo reached over SSH runs the Fabrica CLI through the relay shim, which
 * is always deployed as plain `fabrica` (Unix) / `fabrica.cmd` (Windows). The
 * local `fabrica` rename must not be applied to those remotes, or `fabrica claude-teams` lands on a PATH where it does not exist.
 * `connectionId` is the SSH signal; WSL and local stay false.
 */
export function repoIsRemote(repo: { connectionId?: string | null }): boolean {
  return Boolean(repo.connectionId)
}
