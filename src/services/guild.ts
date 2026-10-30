import { guildId as defaultGuildId } from '@/config/env'
import type { GuildDocument } from '@/models/Guild'
import Guild from '@/models/Guild'

const configCache = new Map<string, { config: GuildDocument; cachedAt: number }>()
const CACHE_DURATION = 60_000

function resolveGuildId(guildId?: string): string {
  const target = guildId ?? defaultGuildId
  if (!target) {
    throw new Error('A guild ID is required when DEPLOY_GLOBAL is true')
  }
  return target
}

export async function getGuildConfig(guildId?: string): Promise<GuildDocument> {
  const target = resolveGuildId(guildId)
  const now = Date.now()
  const cached = configCache.get(target)

  if (cached && now - cached.cachedAt < CACHE_DURATION) {
    return cached.config
  }

  const config = await Guild.findOneAndUpdate(
    { guildId: target },
    { $setOnInsert: { guildId: target } },
    { new: true, upsert: true, lean: true, setDefaultsOnInsert: true }
  )

  if (!config) throw new Error(`Could not load guild config for ${target}`)

  configCache.set(target, { config, cachedAt: now })
  return config
}

export function invalidateGuildCache(guildId?: string): void {
  if (guildId) {
    configCache.delete(guildId)
  } else {
    configCache.clear()
  }
}

export async function updateGuildConfig(
  update: Partial<Pick<GuildDocument, 'staffRoleIds'>>,
  guildId?: string
): Promise<GuildDocument> {
  const target = resolveGuildId(guildId)
  const config = await Guild.findOneAndUpdate({ guildId: target }, update, {
    new: true,
    upsert: true
  }).lean()

  invalidateGuildCache(target)
  return config!
}

export async function addStaffRole(roleId: string, guildId?: string): Promise<GuildDocument> {
  const target = resolveGuildId(guildId)
  const config = await Guild.findOneAndUpdate(
    { guildId: target },
    { $addToSet: { staffRoleIds: roleId } },
    { new: true, upsert: true }
  ).lean()

  invalidateGuildCache(target)
  return config!
}

export async function removeStaffRole(roleId: string, guildId?: string): Promise<GuildDocument> {
  const target = resolveGuildId(guildId)
  const config = await Guild.findOneAndUpdate(
    { guildId: target },
    { $pull: { staffRoleIds: roleId } },
    { new: true, upsert: true }
  ).lean()

  invalidateGuildCache(target)
  return config!
}
