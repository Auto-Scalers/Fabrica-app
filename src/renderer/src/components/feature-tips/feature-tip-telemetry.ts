import { track } from '@/lib/telemetry'
import type { EventProps } from '../../../../shared/telemetry-events'

export type FABRICACliFeatureTipSource = EventProps<'FABRICA_cli_feature_tip_shown'>['source']
export type FABRICACliFeatureTipSetupResult = EventProps<'FABRICA_cli_feature_tip_setup_result'>['result']
export type CmdJPaletteFeatureTipSource = EventProps<'cmd_j_palette_feature_tip_shown'>['source']

export function getFABRICACliFeatureTipTelemetrySource(value: unknown): FABRICACliFeatureTipSource {
  return value === 'app_open' ? 'app_open' : 'manual'
}

export function trackFABRICACliFeatureTipShown(source: FABRICACliFeatureTipSource): void {
  track('FABRICA_cli_feature_tip_shown', { source })
}

export function trackFABRICACliFeatureTipSetupClicked(source: FABRICACliFeatureTipSource): void {
  track('FABRICA_cli_feature_tip_setup_clicked', { source })
}

export function trackFABRICACliFeatureTipSetupResult(
  source: FABRICACliFeatureTipSource,
  result: FABRICACliFeatureTipSetupResult
): void {
  track('FABRICA_cli_feature_tip_setup_result', { source, result })
}

export function trackCmdJPaletteFeatureTipShown(source: CmdJPaletteFeatureTipSource): void {
  track('cmd_j_palette_feature_tip_shown', { source })
}

export function trackCmdJPaletteFeatureTipAcknowledged(source: CmdJPaletteFeatureTipSource): void {
  track('cmd_j_palette_feature_tip_acknowledged', { source })
}
