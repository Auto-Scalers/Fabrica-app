import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import type {
  FABRICAProfileCloudSummary,
  FABRICAProfileListState,
  FABRICAProfileSummary
} from '../../shared/fabrica-profiles'
import {
  getFABRICAProfileDirectory,
  getFABRICAProfileIndexPath,
  loadOrCreateProfileIndex,
  writeProfileIndex
} from './profile-index-store'
import { clearArtifactShareRecords } from '../artifacts/artifact-share-record-store'

export type CreateCloudLinkedFABRICAProfileRecordResult = FABRICAProfileListState & {
  profile: FABRICAProfileSummary
}

function sanitizeProfileName(value: unknown, fallback: string): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return (trimmed || fallback).slice(0, 80)
}

function profileInitial(name: string): string {
  return (name.match(/[A-Za-z0-9]/)?.[0] ?? 'C').toUpperCase()
}

function toCloudLinkedProfile(
  profile: FABRICAProfileSummary,
  cloud: FABRICAProfileCloudSummary,
  now: number
): FABRICAProfileSummary {
  return {
    ...profile,
    kind: 'cloud-linked',
    cloud,
    updatedAt: now,
    lastOpenedAt: now
  }
}

function toLocalProfile(profile: FABRICAProfileSummary, now: number): FABRICAProfileSummary {
  const { cloud: _cloud, ...localProfile } = profile
  return {
    ...localProfile,
    kind: 'local',
    updatedAt: now,
    lastOpenedAt: now
  }
}

export function createCloudLinkedFABRICAProfileRecord(
  cloud: FABRICAProfileCloudSummary,
  args: { name?: string },
  userDataPath: string
): CreateCloudLinkedFABRICAProfileRecordResult {
  const index = loadOrCreateProfileIndex(userDataPath)
  const now = Date.now()
  const fallbackName = cloud.activeOrgName ?? cloud.displayName ?? cloud.email
  const name = sanitizeProfileName(args.name, fallbackName)
  const profile: FABRICAProfileSummary = {
    id: `cloud-${randomUUID()}`,
    name,
    avatar: {
      kind: 'initials',
      initials: profileInitial(name),
      color: 'neutral'
    },
    kind: 'cloud-linked',
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    cloud
  }
  const nextIndex = {
    ...index,
    profiles: [...index.profiles, profile]
  }
  mkdirSync(getFABRICAProfileDirectory(profile.id, userDataPath), { recursive: true })
  writeProfileIndex(getFABRICAProfileIndexPath(userDataPath), nextIndex)
  return {
    activeProfileId: nextIndex.activeProfileId,
    profiles: nextIndex.profiles,
    profile
  }
}

export function linkFABRICAProfileToCloud(
  profileId: string,
  cloud: FABRICAProfileCloudSummary,
  userDataPath: string
): FABRICAProfileListState {
  const index = loadOrCreateProfileIndex(userDataPath)
  const now = Date.now()
  let found = false
  let cloudIdentityChanged = false
  const profiles = index.profiles.map((profile) => {
    if (profile.id !== profileId) {
      return profile
    }
    found = true
    cloudIdentityChanged = Boolean(
      profile.cloud &&
      (profile.cloud.userId !== cloud.userId ||
        profile.cloud.cloudProfileId !== cloud.cloudProfileId)
    )
    return toCloudLinkedProfile(profile, cloud, now)
  })
  if (!found) {
    throw new Error('unknown_FABRICA_profile')
  }
  if (cloudIdentityChanged) {
    clearArtifactShareRecords(profileId, userDataPath)
  }
  const nextIndex = {
    ...index,
    profiles
  }
  writeProfileIndex(getFABRICAProfileIndexPath(userDataPath), nextIndex)
  return {
    activeProfileId: nextIndex.activeProfileId,
    profiles: nextIndex.profiles
  }
}

export function unlinkFABRICAProfileFromCloud(
  profileId: string,
  userDataPath: string
): FABRICAProfileListState {
  const index = loadOrCreateProfileIndex(userDataPath)
  const now = Date.now()
  let found = false
  const profiles = index.profiles.map((profile) => {
    if (profile.id !== profileId) {
      return profile
    }
    found = true
    return toLocalProfile(profile, now)
  })
  if (!found) {
    throw new Error('unknown_FABRICA_profile')
  }
  clearArtifactShareRecords(profileId, userDataPath)
  const nextIndex = {
    ...index,
    profiles
  }
  writeProfileIndex(getFABRICAProfileIndexPath(userDataPath), nextIndex)
  return {
    activeProfileId: nextIndex.activeProfileId,
    profiles: nextIndex.profiles
  }
}
