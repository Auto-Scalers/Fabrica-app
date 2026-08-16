import { describe, expect, it } from 'vitest'
import {
  extractGitHubIssueSourceError,
  extractGitHubIssueSourceFallback
} from './github-work-item-source-errors'

describe('extractGitHubIssueSourceError', () => {
  it('keeps the failing issue source slug with the repo that produced it', () => {
    expect(
      extractGitHubIssueSourceError(
        { id: 'repo-1', path: '/work/FABRICA' },
        {
          sources: { issues: { owner: 'upstream', repo: 'fabrica' } },
          errors: { issues: { message: 'HTTP 403: resource not accessible' } }
        }
      )
    ).toEqual({
      repoId: 'repo-1',
      repoPath: '/work/FABRICA',
      source: { owner: 'upstream', repo: 'fabrica' },
      message: 'HTTP 403: resource not accessible'
    })
  })

  it('drops issue errors when the source slug is unavailable', () => {
    expect(
      extractGitHubIssueSourceError(
        { id: 'repo-1', path: '/work/FABRICA' },
        {
          sources: { issues: null },
          errors: { issues: { message: 'failed' } }
        }
      )
    ).toBeNull()
  })

  it('returns null when the envelope has no issue-side error', () => {
    expect(
      extractGitHubIssueSourceError(
        { id: 'repo-1', path: '/work/FABRICA' },
        {
          sources: { issues: { owner: 'Auto-Scalers', repo: 'fabrica' } }
        }
      )
    ).toBeNull()
  })
})

describe('extractGitHubIssueSourceFallback', () => {
  it('reports the repo whose upstream issue source fell back to origin', () => {
    expect(
      extractGitHubIssueSourceFallback(
        { id: 'repo-1', path: '/work/FABRICA', displayName: 'FABRICA' },
        {
          issueSourceFellBack: true,
          sources: {
            issues: { owner: 'Auto-Scalers', repo: 'FABRICA-fork' },
            prs: { owner: 'Auto-Scalers', repo: 'fabrica' }
          }
        }
      )
    ).toEqual({
      repoId: 'repo-1',
      repoPath: '/work/FABRICA',
      repoLabel: 'Auto-Scalers/FABRICA'
    })
  })

  it('uses the FABRICA repo display name when the PR source is unavailable', () => {
    expect(
      extractGitHubIssueSourceFallback(
        { id: 'repo-1', path: '/work/FABRICA', displayName: 'FABRICA' },
        {
          issueSourceFellBack: true,
          sources: { issues: null, prs: null }
        }
      )
    ).toEqual({
      repoId: 'repo-1',
      repoPath: '/work/FABRICA',
      repoLabel: 'FABRICA'
    })
  })

  it('returns null when the source resolver did not fall back', () => {
    expect(
      extractGitHubIssueSourceFallback(
        { id: 'repo-1', path: '/work/FABRICA', displayName: 'FABRICA' },
        {
          sources: { issues: { owner: 'Auto-Scalers', repo: 'fabrica' } }
        }
      )
    ).toBeNull()
  })
})
