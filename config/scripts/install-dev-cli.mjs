#!/usr/bin/env node
// Symlinks the fabrica-dev wrapper into /usr/local/bin so the dev CLI is
// available globally after `pnpm run build:cli`.
import { existsSync, lstatSync, readlinkSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const scriptDir = import.meta.dirname
const source = path.join(scriptDir, 'fabrica-dev.mjs')

const commandPath =
  process.platform === 'darwin' || process.platform === 'linux'
    ? '/usr/local/bin/fabrica-dev'
    : null

if (!commandPath) {
  console.log('[fabrica-dev] Skipping global symlink (unsupported platform).')
  process.exit(0)
}

function isOwnedByUs(target) {
  try {
    if (!lstatSync(target).isSymbolicLink()) {
      return false
    }
    return readlinkSync(target) === source
  } catch {
    return false
  }
}

if (existsSync(commandPath)) {
  if (isOwnedByUs(commandPath)) {
    console.log(`[fabrica-dev] ${commandPath} already points to dev CLI.`)
    process.exit(0)
  }
  console.error(
    `[fabrica-dev] ${commandPath} exists but is not our symlink. Remove it manually if you want the dev CLI installed globally.`
  )
  process.exit(0)
}

try {
  execFileSync('ln', ['-s', source, commandPath], { stdio: 'inherit' })
  console.log(`[fabrica-dev] Symlinked ${commandPath} → ${source}`)
} catch {
  console.log(
    `[fabrica-dev] Could not create ${commandPath} (permission denied). Run once with:\n` +
      `  sudo ln -s ${source} ${commandPath}`
  )
}
