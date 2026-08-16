import { describe, expect, it } from 'vitest'
import { getUntitledFileRoot } from './untitled-file-rename-path'

describe('getUntitledFileRoot', () => {
  it('uses the real worktree path when one exists', () => {
    expect(
      getUntitledFileRoot(
        { filePath: '/tmp/floating/untitled.md', relativePath: 'untitled.md' },
        '/repo/worktree'
      )
    ).toBe('/repo/worktree')
  })

  it('falls back to the file root for floating markdown files', () => {
    expect(
      getUntitledFileRoot({
        filePath: '/Users/alice/Library/Application Support/Fabrica/floating-workspace/untitled.md',
        relativePath: 'untitled.md'
      })
    ).toBe('/Users/alice/Library/Application Support/Fabrica/floating-workspace')
  })

  it('handles nested untitled relative paths', () => {
    expect(
      getUntitledFileRoot({
        filePath: '/tmp/FABRICA/floating-workspace/notes/untitled.md',
        relativePath: 'notes/untitled.md'
      })
    ).toBe('/tmp/FABRICA/floating-workspace')
  })
})
