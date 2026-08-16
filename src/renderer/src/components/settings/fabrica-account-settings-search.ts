import { createLocalizedCatalog } from '@/i18n/localized-catalog'
import { translate } from '@/i18n/i18n'
import { translateSearchKeyword } from './settings-search-keywords'

export const getFABRICAAccountSettingsSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.FABRICAAccount.account', 'Fabrica account'),
    description: translate(
      'auto.components.settings.FABRICAAccount.searchDescription',
      'Sign in or out of the account used by Artifacts and Fabrica Relay.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.FABRICAAccount.keywordAccount', 'account'),
      ...translateSearchKeyword('auto.components.settings.FABRICAAccount.keywordLogin', 'login'),
      ...translateSearchKeyword('auto.components.settings.FABRICAAccount.keywordLogout', 'logout'),
      ...translateSearchKeyword('auto.components.settings.FABRICAAccount.keywordSignIn', 'sign in'),
      ...translateSearchKeyword('auto.components.settings.FABRICAAccount.keywordSignOut', 'sign out'),
      ...translateSearchKeyword('auto.components.settings.FABRICAAccount.keywordRelay', 'relay'),
      ...translateSearchKeyword('auto.components.settings.FABRICAAccount.keywordCloud', 'cloud')
    ]
  }
])
