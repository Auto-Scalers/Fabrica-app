import type { FsChangedPayload } from '../../../shared/types'

export const FABRICA_WORKTREE_FILE_CHANGE_EVENT = 'FABRICA:worktree-file-change'

export type WorktreeFileChangeEventDetail = {
  payload: FsChangedPayload
  runtimeEnvironmentId: string | null
}
