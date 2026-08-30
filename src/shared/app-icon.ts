export const APP_ICON_OPTIONS = [
  { id: 'classic', label: 'Classic FABRICA' },
  { id: 'dark', label: 'Dark FABRICA' },
  { id: 'light', label: 'Light FABRICA' }
] as const

export type AppIconId = (typeof APP_ICON_OPTIONS)[number]['id']

export const DEFAULT_APP_ICON_ID: AppIconId = 'light'

export function normalizeAppIconId(value: unknown): AppIconId {
  return APP_ICON_OPTIONS.some((option) => option.id === value)
    ? (value as AppIconId)
    : DEFAULT_APP_ICON_ID
}
