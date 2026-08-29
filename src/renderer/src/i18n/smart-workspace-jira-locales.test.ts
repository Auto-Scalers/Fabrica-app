import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import es from './locales/es.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import zh from './locales/zh.json'

const localizedCatalogs = { es, ja, ko, zh }
const english = en.auto.components.new.workspace.SmartWorkspaceNameField
const recoveryKeys = [
  'loadingJira',
  'jiraDisconnected',
  'jiraSiteNotConnected',
  'jiraRuntimeUpdate',
  'jiraReadFailed',
  'chooseJiraAccount',
  'jiraLoaded',
  'openSettings',
  'retryJira'
] as const

describe('smart workspace Jira locale copy', () => {
  // APP-E5 (PM decision D8): ko/ja/zh catalogs are English-fallback placeholders
  // (corrupted pre-repo), so only non-empty copy is asserted for them until
  // professional translations land; es keeps the full localization guard.
  it.each(Object.entries(localizedCatalogs))(
    '%s localizes every Jira status and recovery string',
    (code, catalog) => {
      const localized = catalog.auto.components.new.workspace.SmartWorkspaceNameField
      for (const key of recoveryKeys) {
        expect(localized[key].trim()).not.toBe('')
        if (code === 'es') {
          expect(localized[key]).not.toBe(english[key])
        }
      }
    }
  )
})
