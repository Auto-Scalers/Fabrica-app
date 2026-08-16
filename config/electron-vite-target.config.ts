import { defineConfig } from 'electron-vite'
import { electronViteConfig } from '../electron.vite.config'

const target = process.env.FABRICA_ELECTRON_VITE_TARGET
const configByTarget = {
  main: { main: electronViteConfig.main },
  preload: { preload: electronViteConfig.preload },
  renderer: { renderer: electronViteConfig.renderer }
}

if (!target || !Object.prototype.hasOwnProperty.call(configByTarget, target)) {
  throw new Error(`Invalid FABRICA_ELECTRON_VITE_TARGET: ${target ?? '<unset>'}`)
}

export default defineConfig(configByTarget[target as keyof typeof configByTarget])
