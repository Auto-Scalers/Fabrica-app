import { describe, expect, it } from 'vitest'
import {
  appendFabricaRpcOutput,
  resolveFabricaCliCommand,
  resolveFabricaCliInvocation
} from './live-remote-freeze-rpc.mjs'

describe('live remote freeze RPC', () => {
  it('resolves the Fabrica CLI for managed, dev, Linux, and default runtimes', () => {
    expect(resolveFabricaCliCommand({ env: { FABRICA_CLI_COMMAND: 'custom-fabrica' } })).toBe(
      'custom-fabrica'
    )
    expect(resolveFabricaCliCommand({ env: { FABRICA_DEV_REPO_ROOT: '/repo' } })).toBe('fabrica-dev')
    expect(resolveFabricaCliCommand({ env: {}, platform: 'linux' })).toBe('fabrica')
    expect(resolveFabricaCliCommand({ env: {}, platform: 'win32' })).toBe('fabrica')
  })

  it('bypasses the Windows dev cmd shim with the built Node CLI', () => {
    const invocation = resolveFabricaCliInvocation({
      env: {
        APPDATA: 'C:\\Users\\dev\\AppData\\Roaming',
        FABRICA_CLI_COMMAND: 'C:\\repo\\out\\bin\\fabrica-dev.cmd',
        FABRICA_DEV_REPO_ROOT: 'C:\\repo'
      },
      platform: 'win32',
      nodeExecutable: 'C:\\Program Files\\nodejs\\node.exe'
    })

    expect(invocation).toMatchObject({
      command: 'C:\\Program Files\\nodejs\\node.exe',
      prefixArgs: ['C:\\repo\\out\\cli\\index.js'],
      env: {
        FABRICA_USER_DATA_PATH: 'C:\\Users\\dev\\AppData\\Roaming\\fabrica-dev',
        FABRICA_DEV_CLI_INVOCATION: '1',
        FABRICA_APP_EXECUTABLE: 'C:\\repo\\node_modules\\electron\\dist\\electron.exe',
        FABRICA_APP_EXECUTABLE_NEEDS_APP_ROOT: '1'
      }
    })
  })

  it('caps combined asynchronous output before retaining the overflow chunk', () => {
    const first = appendFabricaRpcOutput('', '1234', 0, 5)
    expect(first).toEqual({ output: '1234', bytes: 4, exceeded: false })

    const overflow = appendFabricaRpcOutput(first.output, '67', first.bytes, 5)
    expect(overflow).toEqual({ output: '1234', bytes: 6, exceeded: true })
  })
})
