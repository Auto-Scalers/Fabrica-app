import { readFileSync } from 'node:fs'

// Why: source-invariant tests assert multi-line string literals written with LF,
// but git core.autocrlf=true checks working-tree sources out as CRLF on Windows.
// Normalize at the read boundary so assertions match regardless of checkout EOLs.
export function readSourceText(url: URL): string {
  return readFileSync(url, 'utf8').replace(/\r\n/g, '\n')
}
