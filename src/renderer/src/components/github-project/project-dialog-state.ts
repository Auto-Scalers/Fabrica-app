type RepoBackedProjectDialogState = {
  repoId: string
}

type SlugProjectDialogState = {
  origin: {
    owner: string
    repo: string
    host?: string
  }
}

type RepoNotInFABRICADialogState = {
  owner: string
  repo: string
  host?: string
}

type RepoMatch = {
  id: string
}

type LookupSlug = (slug: string, host?: string) => readonly RepoMatch[]

function shouldCloseFallbackDialog(args: {
  lookupSlug: LookupSlug
  selectedRepoIds: ReadonlySet<string>
  owner: string
  repo: string
  host?: string
}): boolean {
  const matches = args.lookupSlug(`${args.owner}/${args.repo}`, args.host)
  const selectedMatchCount = matches.filter((match) => args.selectedRepoIds.has(match.id)).length
  const unselectedMatchCount = matches.length - selectedMatchCount
  return selectedMatchCount > 0 || unselectedMatchCount > 0
}

export function resolveRepoBackedProjectDialogState<T extends RepoBackedProjectDialogState>(
  dialog: T | null,
  liveRepoIds: ReadonlySet<string>,
  selectedRepoIds: ReadonlySet<string>
): T | null {
  if (dialog && (!liveRepoIds.has(dialog.repoId) || !selectedRepoIds.has(dialog.repoId))) {
    return null
  }
  return dialog
}

export function resolveMissingRepoProjectDialogState<
  TSlugDialog extends SlugProjectDialogState,
  TRepoNotInFABRICA extends RepoNotInFABRICADialogState
>(args: {
  slugIndexReady: boolean
  slugDialog: TSlugDialog | null
  repoNotInFABRICA: TRepoNotInFABRICA | null
  lookupSlug: LookupSlug
  selectedRepoIds: ReadonlySet<string>
}): {
  slugDialog: TSlugDialog | null
  repoNotInFABRICA: TRepoNotInFABRICA | null
} {
  const { lookupSlug, repoNotInFABRICA, selectedRepoIds, slugDialog, slugIndexReady } = args
  if (!slugIndexReady) {
    return { slugDialog: null, repoNotInFABRICA: null }
  }
  return {
    slugDialog:
      slugDialog &&
      shouldCloseFallbackDialog({
        lookupSlug,
        selectedRepoIds,
        owner: slugDialog.origin.owner,
        repo: slugDialog.origin.repo,
        host: slugDialog.origin.host
      })
        ? null
        : slugDialog,
    repoNotInFABRICA:
      repoNotInFABRICA &&
      shouldCloseFallbackDialog({
        lookupSlug,
        selectedRepoIds,
        owner: repoNotInFABRICA.owner,
        repo: repoNotInFABRICA.repo,
        host: repoNotInFABRICA.host
      })
        ? null
        : repoNotInFABRICA
  }
}
