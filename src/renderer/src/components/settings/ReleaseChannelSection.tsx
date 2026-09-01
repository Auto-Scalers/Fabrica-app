import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../store'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { SettingsSegmentedControl, SettingsSubsectionHeader } from './SettingsFormControls'
import { translate } from '@/i18n/i18n'
import {
  RELEASE_CHANNELS,
  RELEASE_CHANNEL_LABELS,
  getVersionChannel,
  type ReleaseBuild,
  type ReleaseChannel
} from '../../../../shared/release-channel'

const CHANNEL_DESCRIPTIONS: Record<ReleaseChannel, string> = {
  stable: 'Shipped releases. What everyone else is running.',
  rc: 'Release candidates cut ahead of each stable.'
}

function formatBuildLabel(build: ReleaseBuild): string {
  if (build.name) {
    return build.name
  }
  return build.version
}

export function ReleaseChannelSection(): React.JSX.Element {
  const updateStatus = useAppStore((s) => s.updateStatus)
  const releaseChannelOverride = useAppStore((s) => s.releaseChannelOverride)
  const setReleaseChannelOverride = useAppStore((s) => s.setReleaseChannelOverride)

  const [appVersion, setAppVersion] = useState<string | null>(null)
  const [builds, setBuilds] = useState<ReleaseBuild[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const runningChannel = appVersion ? getVersionChannel(appVersion) : null
  const activeChannel = releaseChannelOverride ?? runningChannel ?? 'stable'
  const busy = updateStatus.state === 'checking' || updateStatus.state === 'downloading'

  useEffect(() => {
    let cancelled = false
    void window.api.updater.getVersion().then((version) => {
      if (!cancelled) {
        setAppVersion(version)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const latestRequestRef = useRef(0)

  const loadBuilds = useCallback(async (channel: ReleaseChannel): Promise<void> => {
    const requestId = latestRequestRef.current + 1
    latestRequestRef.current = requestId
    const isStale = (): boolean => latestRequestRef.current !== requestId
    setLoading(true)
    setLoadError(null)
    try {
      const result = await window.api.updater.listBuilds(channel)
      if (isStale()) {
        return
      }
      if (result.ok) {
        setBuilds(result.builds)
        setSelectedTag(result.builds[0]?.tag ?? null)
      } else {
        setBuilds(null)
        setLoadError(result.message)
      }
    } catch (error) {
      if (isStale()) {
        return
      }
      setBuilds(null)
      setLoadError(String((error as Error)?.message ?? error))
    } finally {
      if (!isStale()) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    setBuilds(null)
    setSelectedTag(null)
    void loadBuilds(activeChannel)
  }, [activeChannel, loadBuilds])

  const selectedBuild = useMemo(
    () => builds?.find((build) => build.tag === selectedTag) ?? null,
    [builds, selectedTag]
  )

  const handleSwitchTo = (build: ReleaseBuild): void => {
    void window.api.updater
      .check({ channel: build.channel, targetTag: build.tag })
      .catch((error) => {
        toast.error(
          translate(
            'auto.components.settings.ReleaseChannelSection.switchFailed',
            'Could not switch to that build.'
          ),
          { description: String((error as Error)?.message ?? error) }
        )
      })
  }

  const isRunningBuild = selectedBuild?.version === appVersion

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <SettingsSubsectionHeader
          title={translate(
            'auto.components.settings.ReleaseChannelSection.title',
            'Release channel'
          )}
          description={translate(
            'auto.components.settings.ReleaseChannelSection.description',
            'Switch update channels or jump to any published build, including older ones. Downgrades are allowed.'
          )}
        />
      </div>

      <div className="space-y-2">
        <SettingsSegmentedControl<ReleaseChannel>
          value={activeChannel}
          onChange={(channel) =>
            setReleaseChannelOverride(channel === runningChannel ? null : channel)
          }
          ariaLabel={translate(
            'auto.components.settings.ReleaseChannelSection.channelAriaLabel',
            'Update channel'
          )}
          options={RELEASE_CHANNELS.map((channel) => ({
            value: channel,
            label: RELEASE_CHANNEL_LABELS[channel]
          }))}
        />
        <p className="text-xs text-muted-foreground">{CHANNEL_DESCRIPTIONS[activeChannel]}</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Select
            value={selectedTag ?? undefined}
            onValueChange={setSelectedTag}
            disabled={loading || !builds || builds.length === 0}
          >
            <SelectTrigger size="sm" className="min-w-64 flex-1">
              <SelectValue
                placeholder={
                  loading
                    ? translate(
                        'auto.components.settings.ReleaseChannelSection.loadingBuilds',
                        'Loading builds…'
                      )
                    : translate(
                        'auto.components.settings.ReleaseChannelSection.noBuilds',
                        'No builds found'
                      )
                }
              />
            </SelectTrigger>
            <SelectContent>
              {(builds ?? []).map((build) => (
                <SelectItem key={build.tag} value={build.tag}>
                  {formatBuildLabel(build)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon-sm"
            type="button"
            aria-label={translate(
              'auto.components.settings.ReleaseChannelSection.refresh',
              'Refresh build list'
            )}
            disabled={loading}
            onClick={() => void loadBuilds(activeChannel)}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={!selectedBuild || busy || isRunningBuild}
            onClick={() => selectedBuild && handleSwitchTo(selectedBuild)}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              translate(
                'auto.components.settings.ReleaseChannelSection.switchTo',
                'Switch to build'
              )
            )}
          </Button>
        </div>

        {loadError ? (
          <p className="text-xs text-destructive">{loadError}</p>
        ) : isRunningBuild ? (
          <p className="text-xs text-muted-foreground">
            {translate(
              'auto.components.settings.ReleaseChannelSection.alreadyRunning',
              'This is the build you are running.'
            )}
          </p>
        ) : selectedBuild ? (
          <p className="text-xs text-muted-foreground">
            {translate(
              'auto.components.settings.ReleaseChannelSection.willSwitch',
              '{{value0}} → {{value1}}',
              { value0: appVersion ?? '…', value1: selectedBuild.version }
            )}
          </p>
        ) : null}
      </div>
    </section>
  )
}
