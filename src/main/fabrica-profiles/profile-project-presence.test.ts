import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDefaultPersistedState } from '../../shared/constants'
import {
  FABRICA_PROFILE_INDEX_SCHEMA_VERSION,
  type FABRICAProfileIndex,
  type FABRICAProfileKind
} from '../../shared/fabrica-profiles'
import type { PersistedState, Repo } from '../../shared/types'

const testState = { dir: '' }

vi.mock('electron', () => ({
  app: {
    getPath: () => testState.dir
  }
}))

async function loadPresenceModule() {
  vi.resetModules()
  return import('./profile-project-presence')
}

function profile(
  id: string,
  name: string,
  kind: FABRICAProfileKind = 'local'
): FABRICAProfileIndex['profiles'][number] {
  return {
    id,
    name,
    avatar: { kind: 'initials', initials: name[0], color: 'neutral' },
    kind,
    createdAt: 1,
    updatedAt: 1,
    lastOpenedAt: 1
  }
}

function writeIndex(activeProfileId = 'personal'): void {
  const index: FABRICAProfileIndex = {
    schemaVersion: FABRICA_PROFILE_INDEX_SCHEMA_VERSION,
    activeProfileId,
    profiles: [profile('personal', 'Personal'), profile('work', 'Work')]
  }
  writeFileSync(join(testState.dir, 'FABRICA-profile-index.json'), JSON.stringify(index), 'utf-8')
}

function writeProfileState(profileId: string, repos: Repo[]): void {
  const state: PersistedState = {
    ...getDefaultPersistedState('/Users/tester'),
    repos
  }
  const dataFile = join(testState.dir, 'profiles', profileId, 'FABRICA-data.json')
  mkdirSync(dirname(dataFile), { recursive: true })
  writeFileSync(dataFile, JSON.stringify(state), 'utf-8')
}

function makeRepo(overrides: Partial<Repo> = {}): Repo {
  return {
    id: 'repo-1',
    path: '/workspace/FABRICA',
    displayName: 'FABRICA',
    badgeColor: '#33aa99',
    addedAt: 100,
    kind: 'git',
    connectionId: null,
    ...overrides
  }
}

describe('profile project presence', () => {
  beforeEach(() => {
    testState.dir = mkdtempSync(join(tmpdir(), 'FABRICA-profile-presence-'))
    writeIndex()
  })

  afterEach(() => {
    rmSync(testState.dir, { recursive: true, force: true })
  })

  it('finds matching projects in other profiles while excluding the active profile', async () => {
    writeProfileState('personal', [
      makeRepo({ id: 'personal-repo', path: 'C:\\Code\\FABRICA', displayName: 'Personal FABRICA' })
    ])
    writeProfileState('work', [
      makeRepo({ id: 'work-repo', path: 'C:\\Code\\FABRICA', displayName: 'Work FABRICA' })
    ])

    const { findFABRICAProfileProjectsByPath } = await loadPresenceModule()
    const result = findFABRICAProfileProjectsByPath(
      {
        path: 'c:/code/FABRICA/',
        executionHostId: 'local',
        excludeProfileId: 'personal'
      },
      testState.dir
    )

    expect(result.projects).toEqual([
      {
        profileId: 'work',
        profileName: 'Work',
        profileKind: 'local',
        repoId: 'work-repo',
        repoName: 'Work FABRICA'
      }
    ])
  })

  it('keeps SSH projects separate from local projects with the same path', async () => {
    writeProfileState('personal', [
      makeRepo({ id: 'local-repo', path: '/srv/FABRICA', displayName: 'Local FABRICA' })
    ])
    writeProfileState('work', [
      makeRepo({
        id: 'ssh-repo',
        path: '/srv/FABRICA',
        displayName: 'SSH FABRICA',
        connectionId: 'builder',
        executionHostId: 'ssh:builder'
      })
    ])

    const { findFABRICAProfileProjectsByPath } = await loadPresenceModule()
    const result = findFABRICAProfileProjectsByPath(
      {
        path: '/srv/FABRICA',
        connectionId: 'builder',
        executionHostId: 'ssh:builder'
      },
      testState.dir
    )

    expect(result.projects).toEqual([
      expect.objectContaining({
        profileId: 'work',
        repoId: 'ssh-repo',
        repoName: 'SSH FABRICA'
      })
    ])
  })
})
