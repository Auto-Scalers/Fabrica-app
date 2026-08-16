import type {
  FABRICACloudCapabilities,
  FABRICACloudOrgSummary,
  FABRICAProfileCloudSummary
} from '../../shared/fabrica-profiles'

export type FABRICACloudSessionExchangeResponse = {
  accessToken: string
  refreshToken: string
  expiresAt: number
  cloud: FABRICAProfileCloudSummary
  organizations?: FABRICACloudOrgSummary[]
  capabilities: FABRICACloudCapabilities
}
