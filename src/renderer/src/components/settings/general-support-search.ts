import { translate } from '@/i18n/i18n'
import { createLocalizedCatalog } from '@/i18n/localized-catalog'
import { translateSearchKeyword } from './settings-search-keywords'

export const getGeneralSupportSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate(
      'auto.components.settings.general.search.36a72f0d9e',
      'Star Fabrica on GitHub'
    ),
    description: translate(
      'auto.components.settings.general.search.e0b8c8bc25',
      'Support the project with a GitHub star via the gh CLI.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.general.search.e4fb4516d0', 'star'),
      ...translateSearchKeyword('auto.components.settings.general.search.06ea5a69a6', 'github'),
      ...translateSearchKeyword('auto.components.settings.general.search.b65665703a', 'support'),
      ...translateSearchKeyword('auto.components.settings.general.search.e6b01c8e30', 'feedback'),
      ...translateSearchKeyword('auto.components.settings.general.search.bdfb6dc21b', 'like')
    ]
  },
  {
    title: translate('auto.components.settings.general.search.supportEmail', 'Support Email'),
    description: translate(
      'auto.components.settings.general.search.supportEmailDesc',
      'Contact us via email for support.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.general.search.supportEmailKw1', 'email'),
      ...translateSearchKeyword(
        'auto.components.settings.general.search.supportEmailKw2',
        'support'
      ),
      ...translateSearchKeyword(
        'auto.components.settings.general.search.supportEmailKw3',
        'contact'
      ),
      ...translateSearchKeyword('auto.components.settings.general.search.supportEmailKw4', 'help')
    ]
  },
  {
    title: translate('auto.components.settings.general.search.discord', 'Discord'),
    description: translate(
      'auto.components.settings.general.search.discordDesc',
      'Join our Discord community.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.general.search.discordKw1', 'discord'),
      ...translateSearchKeyword('auto.components.settings.general.search.discordKw2', 'chat'),
      ...translateSearchKeyword('auto.components.settings.general.search.discordKw3', 'community'),
      ...translateSearchKeyword('auto.components.settings.general.search.discordKw4', 'support')
    ]
  },
  {
    title: translate('auto.components.settings.general.search.telegram', 'Telegram'),
    description: translate(
      'auto.components.settings.general.search.telegramDesc',
      'Join our Telegram channel.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.general.search.telegramKw1', 'telegram'),
      ...translateSearchKeyword('auto.components.settings.general.search.telegramKw2', 'chat'),
      ...translateSearchKeyword('auto.components.settings.general.search.telegramKw3', 'community'),
      ...translateSearchKeyword('auto.components.settings.general.search.telegramKw4', 'support')
    ]
  },
  {
    title: translate('auto.components.settings.general.search.whatsapp', 'WhatsApp'),
    description: translate(
      'auto.components.settings.general.search.whatsappDesc',
      'Contact us on WhatsApp.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.general.search.whatsappKw1', 'whatsapp'),
      ...translateSearchKeyword('auto.components.settings.general.search.whatsappKw2', 'chat'),
      ...translateSearchKeyword('auto.components.settings.general.search.whatsappKw3', 'community'),
      ...translateSearchKeyword('auto.components.settings.general.search.whatsappKw4', 'support')
    ]
  },
  {
    title: translate('auto.components.settings.general.search.youtube', 'YouTube'),
    description: translate(
      'auto.components.settings.general.search.youtubeDesc',
      'Watch our tutorials and demos.'
    ),
    keywords: [
      ...translateSearchKeyword('auto.components.settings.general.search.youtubeKw1', 'youtube'),
      ...translateSearchKeyword('auto.components.settings.general.search.youtubeKw2', 'video'),
      ...translateSearchKeyword('auto.components.settings.general.search.youtubeKw3', 'tutorial'),
      ...translateSearchKeyword('auto.components.settings.general.search.youtubeKw4', 'demo')
    ]
  },
  {
    title: translate('auto.components.settings.general.search.instagram', 'Instagram'),
    description: translate(
      'auto.components.settings.general.search.instagramDesc',
      'Follow us on Instagram.'
    ),
    keywords: [
      ...translateSearchKeyword(
        'auto.components.settings.general.search.instagramKw1',
        'instagram'
      ),
      ...translateSearchKeyword('auto.components.settings.general.search.instagramKw2', 'social'),
      ...translateSearchKeyword('auto.components.settings.general.search.instagramKw3', 'follow'),
      ...translateSearchKeyword('auto.components.settings.general.search.instagramKw4', 'updates')
    ]
  },
  {
    title: translate('auto.components.settings.general.search.landingPage', 'Fabrica Website'),
    description: translate(
      'auto.components.settings.general.search.landingPageDesc',
      'Visit our landing page.'
    ),
    keywords: [
      ...translateSearchKeyword(
        'auto.components.settings.general.search.landingPageKw1',
        'website'
      ),
      ...translateSearchKeyword(
        'auto.components.settings.general.search.landingPageKw2',
        'landing'
      ),
      ...translateSearchKeyword('auto.components.settings.general.search.landingPageKw3', 'home'),
      ...translateSearchKeyword('auto.components.settings.general.search.landingPageKw4', 'page'),
      ...translateSearchKeyword('auto.components.settings.general.search.landingPageKw5', 'fabrica')
    ]
  }
])
