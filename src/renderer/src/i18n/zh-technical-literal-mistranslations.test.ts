/**
 * Issue #9574 — high-confidence Simplified Chinese semantic fixes.
 * Guards the anchor GH PR mistranslation and a sample of technical literals /
 * clear sense errors so bootstrap re-translation cannot silently regress them.
 *
 * APP-E5 (PM decision D8): zh.json is an English-fallback placeholder
 * (corrupted pre-repo), so CJK expectations assert key presence at English
 * fallback until professional translations land.
 */
import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import zh from './locales/zh.json'

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

describe('zh technical literal / sense fixes (#9574)', () => {
  it('keeps GH PR as a technical literal (not 生长激素受体)', () => {
    expect(findByKey(zh, '1b91db7e14')).toBe('GH PR')
  })

  it('keeps CLI / product technical strings un-translated', () => {
    expect(findByKey(zh, 'fe119187bb')).toBe('--model sonnet')
    expect(findByKey(zh, '5c5b65044e')).toBe('pnpm install')
    expect(findByKey(zh, '5af8251002')).toBe('SCSS')
    expect(findByKey(zh, '97e96cc027')).toBe('/goal')
    expect(findByKey(zh, 'f62ce91ade')).toBe('origin')
    expect(findByKey(zh, '79afc6772b')).toBe('FABRICA.yaml')
  })

  it('keeps the corrected sense keys present (English fallback)', () => {
    // Move / Memory / Stage / State / Bar cursor / Block cursor
    for (const key of ['ac037cfac2', '1b24a32d3a', '8cde1a2fb0', 'af2b07bda5', 'e070e8aeba', '52854a5608']) {
      expect(findByKey(zh, key), key).toBe(findByKey(en, key))
    }
  })

  it('preserves brand names in product copy', () => {
    for (const key of ['855a76343a', '0a75e5e2fa', 'ff450194cd']) {
      expect(findByKey(zh, key), key).toBe(findByKey(en, key))
    }
  })
})

// #12881 — the status bar provider usage surfaces settle on 使用情况, matching the Kimi/MiniMax
// entries that already used it. Scope is those surfaces, not the word "usage" everywhere: a
// measured volume ("Daily usage" 每日使用量, "Refresh Claude usage" 刷新 Claude 使用量) stays 使用量.
describe('zh provider usage wording (#12881)', () => {
  it('keeps every "<Brand> Usage" label key present (English fallback)', () => {
    const usageKeys = [
      // status bar item menu
      '3885eb74d8',
      'c0909c686e',
      'c1df0d67ec',
      'antigravityUsage',
      '8c86cd77b0',
      '5e59007df4',
      '3bbf140864',
      'grokUsageMenu',
      // Settings > Appearance search index — mirrors the menu labels
      '9dc15020d7',
      '54b1acf24f',
      '5bfb874d05',
      'antigravityUsageTitle',
      'bc046e7899',
      '3a6c028ea8',
      '0f08f6b483',
      'f8e2a1c4b6',
      // Settings > Accounts search index
      '733f9e2a93',
      'f4a8c2e1b7'
    ]
    for (const key of usageKeys) {
      expect(findByKey(zh, key), key).toBe(findByKey(en, key))
    }
  })

  it('leaves the Kimi and Moonshot search keywords untransliterated', () => {
    expect(findByKey(zh, '40e5c3c285')).toBe('kimi') // not 基米
    expect(findByKey(zh, '35565867cb')).toBe('moonshot') // not 登月计划 ("moon landing programme")
  })

  it('keeps the status bar toggle description keys present (English fallback)', () => {
    for (const key of [
      'antigravityUsageDescription',
      'e7d1b0f3a5',
      'grokToggleDescription',
      'antigravityToggleDescription'
    ]) {
      expect(findByKey(zh, key), key).toBe(findByKey(en, key))
    }
  })

  it('keeps the "Open <Brand> usage details" label keys present (English fallback)', () => {
    for (const key of [
      'fda8146810',
      '629251f4b6',
      'd2375976eb',
      '06741a2f3d',
      'antigravityUsageDetails',
      'grokUsageAria'
    ]) {
      expect(findByKey(zh, key), key).toBe(findByKey(en, key))
    }
  })
})
