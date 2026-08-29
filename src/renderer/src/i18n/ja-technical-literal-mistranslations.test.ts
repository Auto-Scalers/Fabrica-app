/**
 * Guards the source control "Push"/"Pull" button mistranslations so
 * bootstrap re-translation cannot silently regress them.
 *
 * APP-E5 (PM decision D8): ja.json is an English-fallback placeholder
 * (corrupted pre-repo), so the guard asserts key presence at English
 * fallback until professional translations land.
 */
import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import ja from './locales/ja.json'

function findByKey(node: unknown, key: string): string | undefined {
  if (!node || typeof node !== 'object') {
    return undefined
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findByKey(item, key)
      if (found !== undefined) {
        return found
      }
    }
    return undefined
  }
  const record = node as Record<string, unknown>
  if (typeof record[key] === 'string') {
    return record[key] as string
  }
  for (const value of Object.values(record)) {
    const found = findByKey(value, key)
    if (found !== undefined) {
      return found
    }
  }
  return undefined
}

describe('ja technical literal / sense fixes', () => {
  it('keeps the source control Push action present (English fallback)', () => {
    expect(findByKey(ja, '95550cff15')).toBe(findByKey(en, '95550cff15'))
  })

  it('keeps the source control Pull action present (English fallback)', () => {
    expect(findByKey(ja, 'd64292a938')).toBe(findByKey(en, 'd64292a938'))
  })
})
