import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getFABRICAElectronLaunchArgs } from './electron-launch-args'

describe('getFABRICAElectronLaunchArgs', () => {
  it('launches the package root that owns the compiled main entry', () => {
    const root = join('workspace', 'FABRICA')
    const mainPath = join(root, 'out', 'main', 'index.js')

    expect(getFABRICAElectronLaunchArgs(mainPath, true)).toEqual([root])
    expect(getFABRICAElectronLaunchArgs(mainPath, false).at(-1)).toBe(root)
  })
})
