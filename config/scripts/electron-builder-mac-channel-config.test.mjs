import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const electronBuilderConfig = require('../electron-builder.config.cjs')

describe('electron-builder mac channel config', () => {
  it('publishes to the main fabrica repo as a release', () => {
    expect(electronBuilderConfig.publish).toMatchObject({
      repo: 'fabrica',
      releaseType: 'release'
    })
  })
})
