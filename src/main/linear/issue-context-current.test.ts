import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LinearWorkspace } from '../../shared/types'

const { connectedWorkspaces } = vi.hoisted(() => ({
  connectedWorkspaces: [] as LinearWorkspace[]
}))

vi.mock('./issue-context-client', () => ({
  getConnectedWorkspaces: () => connectedWorkspaces
}))

import {
  getLinearCurrentIssueFromWorktree,
  resolveLegacyLinearLinkWorkspace
} from './issue-context-current'

describe('linear issue current worktree link resolution', () => {
  beforeEach(() => {
    connectedWorkspaces.length = 0
  })

  it('uses split organization URL key metadata from CLI-created Linear links', () => {
    const link = getLinearCurrentIssueFromWorktree({
      id: 'repo::/tmp/worktree',
      path: '/tmp/worktree',
      linkedLinearIssue: 'sta-335',
      linkedLinearIssueWorkspaceId: null,
      linkedLinearIssueOrganizationUrlKey: 'fabrica'
    })

    expect(link).toMatchObject({
      identifier: 'STA-335',
      workspaceId: null,
      organizationUrlKey: 'fabrica',
      worktreeId: 'repo::/tmp/worktree'
    })
  })

  it('backfills workspace id from split organization URL key metadata', () => {
    connectedWorkspaces.push(
      makeWorkspace('workspace-1', 'fabrica'),
      makeWorkspace('workspace-2', 'acme')
    )

    expect(resolveLegacyLinearLinkWorkspace('STA-335', 'fabrica')).toEqual({
      workspaceId: 'workspace-1',
      organizationUrlKey: 'fabrica'
    })
  })

  it('keeps ambiguous split organization URL key backfill workspace-free', () => {
    connectedWorkspaces.push(
      makeWorkspace('workspace-1', 'fabrica'),
      makeWorkspace('workspace-2', 'fabrica')
    )

    expect(resolveLegacyLinearLinkWorkspace('STA-335', 'fabrica')).toEqual({
      organizationUrlKey: 'fabrica'
    })
  })
})

function makeWorkspace(id: string, organizationUrlKey: string): LinearWorkspace {
  return {
    id,
    organizationId: id,
    organizationName: organizationUrlKey,
    organizationUrlKey,
    displayName: organizationUrlKey,
    email: `${id}@example.com`
  }
}
