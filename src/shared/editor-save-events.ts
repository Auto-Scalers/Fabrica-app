export const FABRICA_EDITOR_SAVE_DIRTY_FILES_EVENT = 'FABRICA:editor-save-dirty-files'
export const FABRICA_EDITOR_PREPARE_HOT_EXIT_EVENT = 'FABRICA:editor-prepare-hot-exit'

export type EditorSaveDirtyFilesDetail = {
  claim: () => void
  resolve: () => void
  reject: (message: string) => void
}

export type EditorPrepareHotExitDetail = EditorSaveDirtyFilesDetail
