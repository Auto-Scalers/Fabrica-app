export function getFABRICACliCommandNameForPlatform(platform: NodeJS.Platform): string {
  if (platform === 'linux') {
    return 'fabrica'
  }
  if (platform === 'win32') {
    return 'fabrica.cmd'
  }
  return 'fabrica'
}
