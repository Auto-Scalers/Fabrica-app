import { describe, expect, it } from 'vitest'
import type { Repo } from '../../../../shared/types'
import { getRepoMultiComboboxDetail } from './repo-multi-combobox'

function repo(overrides: Partial<Repo> = {}): Repo {
  return {
    id: 'repo-1',
    path: '/Users/jinwoo/FABRICA',
    displayName: 'FABRICA',
    badgeColor: '#999999',
    addedAt: 1,
    ...overrides
  }
}

describe('getRepoMultiComboboxDetail', () => {
  it('shows host context before the path when available', () => {
    expect(getRepoMultiComboboxDetail(repo(), 'Local Mac')).toBe('Local Mac · /Users/jinwoo/FABRICA')
    expect(getRepoMultiComboboxDetail(repo({ path: '/home/FABRICA/FABRICA' }), 'openclaw 2')).toBe(
      'openclaw 2 · /home/FABRICA/FABRICA'
    )
  })

  it('keeps the existing path-only detail when no host label is provided', () => {
    expect(getRepoMultiComboboxDetail(repo(), null)).toBe('/Users/jinwoo/FABRICA')
    expect(getRepoMultiComboboxDetail(repo(), '   ')).toBe('/Users/jinwoo/FABRICA')
  })
})
