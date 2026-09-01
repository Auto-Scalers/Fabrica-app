import type React from 'react'
import { useEffect, useState } from 'react'
import {
  ExternalLink,
  Loader2,
  Mail,
  Send,
  Phone,
  Youtube,
  Instagram,
  Globe,
  Star
} from 'lucide-react'
import { useMountedRef } from '@/hooks/useMountedRef'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { SearchableSetting } from './SearchableSetting'
import { SettingsSubsectionHeader } from './SettingsFormControls'
import { translate } from '@/i18n/i18n'

// Do not deep-link to /stargazers: GitHub 404s that page for users without repo write access.
const FABRICA_GITHUB_URL = 'https://github.com/Auto-Scalers/Fabrica-app'
const SUPPORT_EMAIL = 'mailto:support@fabrica-ai.vercel.app'
const DISCORD_URL = 'https://discord.gg/fabrica'
const TELEGRAM_URL = 'https://t.me/fabrica'
const WHATSAPP_URL = 'https://wa.me/fabrica'
const YOUTUBE_URL = 'https://youtube.com/@fabrica'
const INSTAGRAM_URL = 'https://instagram.com/fabrica'
const LANDING_PAGE_URL = 'https://fabrica-ai.vercel.app'

type SupportState =
  | 'loading'
  | 'not-starred'
  | 'web-fallback'
  | 'opening-github'
  | 'starring'
  | 'starred'
  | 'hidden'

type GeneralSupportSectionProps = {
  hasPrecedingSections: boolean
}

export function GeneralSupportSection({
  hasPrecedingSections
}: GeneralSupportSectionProps): React.JSX.Element {
  const mountedRef = useMountedRef()
  // Why: the star state is derived from gh, not from settings, so it does not
  // live in the global settings store. 'hidden' covers already-starred users
  // so the section drops out for people who don't need to act.
  //
  // We start in 'loading' and render a placeholder at the exact same
  // dimensions as the resolved section. When gh resolves to 'hidden', the
  // placeholder collapses with a grid-rows transition so content above it
  // doesn't shift; anything below (nothing today, but future-proof) eases up.
  const [starState, setStarState] = useState<SupportState>('loading')

  useEffect(() => {
    let cancelled = false
    void window.api.gh.checkFABRICAStarred().then((result) => {
      if (cancelled) {
        return
      }
      if (result === null) {
        setStarState('web-fallback')
      } else {
        setStarState(result ? 'starred' : 'not-starred')
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleStarClick = async (): Promise<void> => {
    if (starState === 'web-fallback') {
      setStarState('opening-github')
      await window.api.shell.openUrl(FABRICA_GITHUB_URL)
      if (mountedRef.current) {
        setStarState('web-fallback')
      }
      return
    }
    if (starState !== 'not-starred') {
      return
    }
    setStarState('starring')
    const ok = await window.api.gh.starFABRICA('settings')
    if (!ok) {
      if (mountedRef.current) {
        setStarState('web-fallback')
      }
      return
    }
    if (mountedRef.current) {
      setStarState('starred')
    }
    // Why: clicking star anywhere should also permanently mute the
    // threshold-based nag so the user isn't re-prompted via the popup.
    await window.api.starNag.complete()
  }

  return (
    <SupportSection
      state={starState}
      hasPrecedingSections={hasPrecedingSections}
      onStarClick={handleStarClick}
    />
  )
}

type SupportSectionProps = {
  state: SupportState
  hasPrecedingSections: boolean
  onStarClick: () => void | Promise<void>
}

function SupportSection({
  state,
  hasPrecedingSections,
  onStarClick
}: SupportSectionProps): React.JSX.Element {
  // Why: 'hidden' means gh is unavailable or the user had already starred on a
  // previous session. Collapse the whole section, including its leading
  // Separator, so the settings pane doesn't carry an empty strip.
  const collapsed = state === 'hidden'

  return (
    <section
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
        collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
      }`}
      aria-hidden={collapsed}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="space-y-8">
          {hasPrecedingSections ? <Separator /> : null}
          <div className="space-y-4">
            <SettingsSubsectionHeader
              title={translate(
                'auto.components.settings.GeneralSupportSection.55a87e5fd1',
                'Support Fabrica'
              )}
            />
            {state === 'loading' ? <SupportRowSkeleton /> : null}
            {state !== 'loading' && state !== 'hidden' ? (
              <SupportRow state={state} onStarClick={onStarClick} />
            ) : null}
            <SupportLinks />
          </div>
        </div>
      </div>
    </section>
  )
}

function SupportRowSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4 py-2" aria-hidden="true">
      <div className="h-4 w-36 rounded bg-muted/50 animate-pulse" />
      <div className="h-8 w-24 rounded-md bg-muted/50 animate-pulse" />
    </div>
  )
}

function SupportRow({
  state,
  onStarClick
}: {
  state: 'not-starred' | 'web-fallback' | 'opening-github' | 'starring' | 'starred'
  onStarClick: () => void | Promise<void>
}): React.JSX.Element {
  // Why: the left-hand label is the setting's identity and must not change
  // when the user clicks. The right-hand control is what changes: before
  // starring it is a button; after success it becomes a small confirmation.
  return (
    <SearchableSetting
      title={translate(
        'auto.components.settings.GeneralSupportSection.6922c1fa2b',
        'Star Fabrica on GitHub'
      )}
      description={translate(
        'auto.components.settings.GeneralSupportSection.511782265b',
        'Support the project with a GitHub star.'
      )}
      keywords={['star', 'github', 'support', 'feedback', 'like']}
      className="flex items-center justify-between gap-4 py-2"
    >
      <Label>
        {translate(
          'auto.components.settings.GeneralSupportSection.6922c1fa2b',
          'Star Fabrica on GitHub'
        )}
      </Label>
      {state === 'starred' ? (
        <SupportRowThanks />
      ) : (
        <Button
          variant="default"
          size="sm"
          onClick={() => void onStarClick()}
          disabled={state === 'starring' || state === 'opening-github'}
          className="shrink-0 gap-1.5"
        >
          {state === 'starring' || state === 'opening-github' ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : state === 'web-fallback' ? (
            <ExternalLink className="size-3.5" />
          ) : (
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
          )}
          {state === 'starring'
            ? translate('auto.components.settings.GeneralSupportSection.397719bee5', 'Starring...')
            : state === 'opening-github'
              ? translate('auto.components.settings.GeneralSupportSection.cb65c75b11', 'Opening...')
              : state === 'web-fallback'
                ? translate(
                    'auto.components.settings.GeneralSupportSection.f2d4f877b2',
                    'Open GitHub'
                  )
                : translate('auto.components.settings.GeneralSupportSection.964acc6bb4', 'Star')}
        </Button>
      )}
    </SearchableSetting>
  )
}

function SupportRowThanks(): React.JSX.Element {
  // Why: match the size="sm" button's h-8 / gap-1.5 / px-3 dimensions so the
  // row height stays identical when the button is swapped out.
  return (
    <div
      className="shrink-0 inline-flex h-8 items-center gap-1.5 px-3 text-sm font-medium
        text-amber-400/90 animate-in fade-in slide-in-from-right-1 duration-300"
      role="status"
      aria-live="polite"
    >
      <Star className="size-3.5 fill-amber-400/80 text-amber-400/80" aria-hidden="true" />
      {translate(
        'auto.components.settings.GeneralSupportSection.af7d9f4396',
        'Thanks for the support!'
      )}
    </div>
  )
}

type SupportLinkItemProps = {
  icon: React.ReactNode
  title: string
  description: string
  url: string
  keywords: string[]
}

function SupportLinkItem({
  icon,
  title,
  description,
  url,
  keywords
}: SupportLinkItemProps): React.JSX.Element {
  const handleClick = (): void => {
    void window.api.shell.openUrl(url)
  }

  return (
    <SearchableSetting
      title={title}
      description={description}
      keywords={keywords}
      className="flex items-center justify-between gap-4 py-2"
    >
      <Label>{title}</Label>
      <Button variant="outline" size="sm" onClick={handleClick} className="shrink-0 gap-1.5">
        {icon}
        <ExternalLink className="size-3.5" />
      </Button>
    </SearchableSetting>
  )
}

function SupportLinks(): React.JSX.Element {
  return (
    <div className="space-y-4">
      <SupportLinkItem
        icon={<Mail className="size-3.5" />}
        title={translate(
          'auto.components.settings.GeneralSupportSection.supportEmail',
          'Support Email'
        )}
        description={translate(
          'auto.components.settings.GeneralSupportSection.supportEmailDesc',
          'Contact us via email for support.'
        )}
        url={SUPPORT_EMAIL}
        keywords={['email', 'support', 'contact', 'help']}
      />
      <SupportLinkItem
        icon={
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 fill-current">
            <path d="M20.317 4.369A19.791 19.791 0 0 0 15.885 3c-.191.328-.403.77-.553 1.116a18.27 18.27 0 0 0-5.098 0A12.64 12.64 0 0 0 9.68 3a19.736 19.736 0 0 0-4.433 1.369C2.444 8.479 1.69 12.488 2.067 16.44a19.912 19.912 0 0 0 5.427 2.744c.438-.598.828-1.23 1.164-1.89a12.95 12.95 0 0 1-1.833-.877c.154-.113.305-.231.45-.352a14.294 14.294 0 0 0 12.45 0c.146.12.296.239.45.352-.585.34-1.2.634-1.835.878.337.659.727 1.29 1.165 1.888a19.84 19.84 0 0 0 5.43-2.744c.442-4.579-.755-8.551-3.932-12.07ZM9.955 14.005c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.211 0 2.176 1.095 2.157 2.418 0 1.334-.955 2.419-2.157 2.419Zm4.09 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.211 0 2.176 1.095 2.157 2.418 0 1.334-.946 2.419-2.157 2.419Z" />
          </svg>
        }
        title={translate('auto.components.settings.GeneralSupportSection.discord', 'Discord')}
        description={translate(
          'auto.components.settings.GeneralSupportSection.discordDesc',
          'Join our Discord community.'
        )}
        url={DISCORD_URL}
        keywords={['discord', 'chat', 'community', 'support']}
      />
      <SupportLinkItem
        icon={<Send className="size-3.5" />}
        title={translate('auto.components.settings.GeneralSupportSection.telegram', 'Telegram')}
        description={translate(
          'auto.components.settings.GeneralSupportSection.telegramDesc',
          'Join our Telegram channel.'
        )}
        url={TELEGRAM_URL}
        keywords={['telegram', 'chat', 'community', 'support']}
      />
      <SupportLinkItem
        icon={<Phone className="size-3.5" />}
        title={translate('auto.components.settings.GeneralSupportSection.whatsapp', 'WhatsApp')}
        description={translate(
          'auto.components.settings.GeneralSupportSection.whatsappDesc',
          'Contact us on WhatsApp.'
        )}
        url={WHATSAPP_URL}
        keywords={['whatsapp', 'chat', 'community', 'support']}
      />
      <SupportLinkItem
        icon={<Youtube className="size-3.5" />}
        title={translate('auto.components.settings.GeneralSupportSection.youtube', 'YouTube')}
        description={translate(
          'auto.components.settings.GeneralSupportSection.youtubeDesc',
          'Watch our tutorials and demos.'
        )}
        url={YOUTUBE_URL}
        keywords={['youtube', 'video', 'tutorial', 'demo']}
      />
      <SupportLinkItem
        icon={<Instagram className="size-3.5" />}
        title={translate('auto.components.settings.GeneralSupportSection.instagram', 'Instagram')}
        description={translate(
          'auto.components.settings.GeneralSupportSection.instagramDesc',
          'Follow us on Instagram.'
        )}
        url={INSTAGRAM_URL}
        keywords={['instagram', 'social', 'follow', 'updates']}
      />
      <SupportLinkItem
        icon={<Globe className="size-3.5" />}
        title={translate(
          'auto.components.settings.GeneralSupportSection.landingPage',
          'Fabrica Website'
        )}
        description={translate(
          'auto.components.settings.GeneralSupportSection.landingPageDesc',
          'Visit our landing page.'
        )}
        url={LANDING_PAGE_URL}
        keywords={['website', 'landing', 'home', 'page', 'fabrica']}
      />
    </div>
  )
}
