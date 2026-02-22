import { guildId } from '@/config/env'
import type { GuildDocument } from '@/models/Guild'
import Guild from '@/models/Guild'

let configCache: GuildDocument | null = null
let cacheTime = 0
const CACHE_DURATION = 60_000

export async function getGuildConfig(): Promise<GuildDocument> {
  const now = Date.now()

  if (configCache && now - cacheTime < CACHE_DURATION) {
    return configCache
  }

  let config = await Guild.findOne({ guildId }).lean()

  if (!config) {
    const created = await Guild.create({ guildId })
    config = created.toObject()
  }

  configCache = config
  cacheTime = now

  return config
}