// Why: single source of truth for the commit trailer FABRICA appends when the
// "FABRICA Attribution" toggle (`enableGitHubAttribution`) is on. Used by both
// the terminal git/gh shim and the AI commit-message generator so the two
// code paths agree on the exact string.

export const FABRICA_GIT_COMMIT_TRAILER = 'Co-authored-by: Fabrica <fabrica.studio.contact@gmail.com>'
