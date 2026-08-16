#!/usr/bin/env node
// Build the Fabrica app/icon/tray raster assets from the brand emblem PNG.
// Reuses the ICO pipeline from trim-windows-icon-source.mjs and emits a
// hand-built multi-resolution icns (no macOS actool/iconutil available).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { PNG } from 'pngjs'
import {
  buildWindowsIcoFromPng,
  cropImage,
  findOpaqueBounds,
  resizeImage,
  squareWithMargin
} from './trim-windows-icon-source.mjs'

const scriptDir = import.meta.dirname
const projectDir = dirname(dirname(scriptDir))
const SOURCE_PNG = join(projectDir, '..', 'STRATEGY', 'Assets', 'fabrica-logo_icon.png')
const resDir = join(projectDir, 'resources')
const buildDir = join(resDir, 'build')
const appIconsDir = join(resDir, 'app-icons')
const trayDir = join(resDir, 'tray')

function readPng(path) {
  return PNG.sync.read(readFileSync(path))
}

function writePng(path, image) {
  const png = new PNG({ width: image.width, height: image.height })
  image.data.copy(png.data)
  writeFileSync(path, PNG.sync.write(png))
}

// Re-render the emblem as a solid single-color silhouette for variant icons and
// the macOS tray template (template images must be black + alpha).
function silhouette(image, rgb) {
  const { width, height, data } = cropImage(image, findOpaqueBounds(image))
  const out = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4
      const dst = (y * width + x) * 4
      out[dst] = rgb[0]
      out[dst + 1] = rgb[1]
      out[dst + 2] = rgb[2]
      out[dst + 3] = data[src + 3]
    }
  }
  return { width, height, data: out }
}

// Fit a glyph onto a canvas of the given WxH, centered, preserving glyph size.
function fitCanvas(image, canvasWidth, canvasHeight) {
  const glyph = cropImage(image, findOpaqueBounds(image))
  const glyphW = Math.round(
    glyph.width * Math.min(canvasWidth / glyph.width, canvasHeight / glyph.height)
  )
  const glyphH = Math.round(
    glyph.height * Math.min(canvasWidth / glyph.width, canvasHeight / glyph.height)
  )
  const resized = resizeImage(glyph, glyphW, glyphH)
  const data = Buffer.alloc(canvasWidth * canvasHeight * 4)
  const offsetX = Math.floor((canvasWidth - resized.width) / 2)
  const offsetY = Math.floor((canvasHeight - resized.height) / 2)
  for (let y = 0; y < resized.height; y++) {
    const srcStart = y * resized.width * 4
    const dstStart = ((offsetY + y) * canvasWidth + offsetX) * 4
    data.set(resized.data.subarray(srcStart, srcStart + resized.width * 4), dstStart)
  }
  return { width: canvasWidth, height: canvasHeight, data }
}

function centerSquare(image, size, marginRatio = 0.02) {
  const trimmed = cropImage(image, findOpaqueBounds(image))
  const filled = squareWithMargin(trimmed, marginRatio)
  const square = resizeImage(filled, size, size)
  // Re-center a shorter glyph (e.g. tray) by padding the square canvas.
  const canvas = Buffer.alloc(size * size * 4)
  const offsetX = Math.floor((size - square.width) / 2)
  const offsetY = Math.floor((size - square.height) / 2)
  for (let y = 0; y < square.height; y++) {
    const srcStart = y * square.width * 4
    const dstStart = ((offsetY + y) * size + offsetX) * 4
    canvas.set(square.data.subarray(srcStart, srcStart + square.width * 4), dstStart)
  }
  return { width: size, height: size, data: canvas }
}

// Encoder for the mac icon set: PNG-compressed chunks (macOS 10.7+, the format
// actool/iconutil produce). Skip it on non-darwin CI by writing nothing today.
const ICNS_CHUNK_TYPES = [
  ['icp4', 16],
  ['icp5', 32],
  ['icp6', 64],
  ['ic07', 128],
  ['ic08', 256],
  ['ic09', 512],
  ['ic10', 1024]
]

function buildIcns(sourceImage) {
  const flattened = cropImage(sourceImage, findOpaqueBounds(sourceImage))
  const chunks = ICNS_CHUNK_TYPES.map(([type, size]) => {
    const frame = centerSquare(flattened, size, 0.02)
    const png = PNG.sync.write(new PNG({ width: size, height: size, data: frame.data }))
    const header = Buffer.alloc(8)
    header.write(type, 0, 'ascii')
    header.writeUInt32BE(8 + png.length, 4)
    return Buffer.concat([header, png])
  })
  const payload = Buffer.concat(chunks)
  const header = Buffer.alloc(8)
  header.write('icns', 0, 'ascii')
  header.writeUInt32BE(8 + payload.length, 4)
  return Buffer.concat([header, payload])
}

function main() {
  if (!existsSync(SOURCE_PNG)) {
    console.error(`Source emblem not found at ${SOURCE_PNG}`)
    process.exit(1)
  }
  const source = readPng(SOURCE_PNG)
  const bounds = findOpaqueBounds(source)
  const emblem = cropImage(source, bounds)

  // build/icon.png — the 1024 master (also feeds Windows ICO + icns).
  const master = squareWithMargin(emblem, 0.02)
  writePng(join(buildDir, 'icon.png'), resizeImage(master, 1024, 1024))

  // build/icon.ico — Windows multi-size, via the existing trim pipeline.
  const ico = buildWindowsIcoFromPng(readFileSync(join(buildDir, 'icon.png')))
  writeFileSync(join(buildDir, 'icon.ico'), ico)

  // build/icon.icns — hand-built mac icon set.
  writeFileSync(join(buildDir, 'icon.icns'), buildIcns(emblem))

  // resources/icon.png + icon-dev.png — classic app icon (256).
  writePng(join(resDir, 'icon.png'), centerSquare(emblem, 256, 0.02))
  writePng(join(resDir, 'icon-dev.png'), centerSquare(emblem, 256, 0.02))

  // App-icon picker variants (2-color silhouettes, like the current set).
  writePng(join(appIconsDir, 'fabrica-blue.png'), centerSquare(silhouette(emblem, [0, 22, 55]), 1024, 0.02))
  writePng(join(appIconsDir, 'fabrica-watercolor.png'), centerSquare(silhouette(emblem, [204, 122, 74]), 1024, 0.02))

  // macOS tray template — black silhouette on a small canvas (22x14 / 44x28).
  writePng(join(trayDir, 'fabrica-menu-barTemplate.png'), fitCanvas(silhouette(emblem, [0, 0, 0]), 22, 14))
  writePng(join(trayDir, 'fabrica-menu-barTemplate@2x.png'), fitCanvas(silhouette(emblem, [0, 0, 0]), 44, 28))

  console.log('  -> Fabric icons written to resources/build, resources/, app-icons/, tray/')
}

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('build-fabrica-icons.mjs')
) {
  main()
}