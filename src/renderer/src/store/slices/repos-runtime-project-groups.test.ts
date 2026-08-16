import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repo } from '../../../../shared/types'
import {
  createCompatibleRuntimeStatusResponseIfNeeded,
  type RuntimeEnvironmentCallRequest
} from '../../runtime/runtime-compatibility-test-fixture'
import { clearRuntimeCompatibilityCacheForTests } from '../../runtime/runtime-rpc-client'
import { createTestStore } from './store-test-helpers'

const runtimeEnvironmentCall = vi.fn()
const runtimeEnvironmentTransportCall = vi.fn()

beforeEach(() => {
  clearRuntimeCompatibilityCacheForTests()
  runtimeEnvironmentCall.mockReset()
  runtimeEnvironmentTransportCall.mockReset()
  runtimeEnvironmentTransportCall.mockImplementation((args: RuntimeEnvironmentCallRequest) => {
    return createCompatibleRuntimeStatusResponseIfNeeded(args) ?? runtimeEnvironmentCall(args)
  })
  vi.stubGlobal('window', {
    api: {
      runtimeEnvironments: { call: runtimeEnvironmentTransportCall }
    }
  })
})

describe('repo slice runtime project groups', () => {
  it('keeps runtime copies of a grouped canonical project in the same project group', async () => {
    const gitRemoteIdentity = {
      canonicalKey: 'github.com/Auto-Scalers/Fabrica-app',
      remoteName: 'origin',
      remoteUrl: 'https://github.com/Auto-Scalers/Fabrica-app.git'
    }
    const localFABRICA: Repo = {
      id: 'local-FABRICA',
      path: '/Users/alice/stably/FABRICA',
      displayName: 'FABRICA',
      badgeColor: '#000',
      addedAt: 1,
      executionHostId: 'local',
      gitRemoteIdentity,
      projectGroupId: 'group-FABRICA'
    }
    const runtimeFABRICA: Repo = {
      id: 'runtime-FABRICA',
      path: '/vercel/sandbox/FABRICA',
      displayName: 'FABRICA',
      badgeColor: '#111',
      addedAt: 2,
      gitRemoteIdentity
    }
    runtimeEnvironmentCall.mockResolvedValue({
      id: 'rpc-runtime-FABRICA',
      ok: true,
      result: { repos: [runtimeFABRICA] },
      _meta: { runtimeId: 'runtime-remote' }
    })
    const store = createTestStore()
    store.setState({
      settings: { activeRuntimeEnvironmentId: 'env-1' } as never,
      repos: [localFABRICA]
    })

    await store.getState().fetchRepos()

    expect(store.getState().repos).toEqual([
      localFABRICA,
      {
        ...runtimeFABRICA,
        executionHostId: 'runtime:env-1',
        projectGroupId: 'group-FABRICA'
      }
    ])
  })
})
