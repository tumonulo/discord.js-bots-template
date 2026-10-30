import { PermissionFlagsBits, GuildMember } from 'discord.js'
import type { GuildMember as GuildMemberType, ChatInputCommandInteraction } from 'discord.js'
import type { CommandPermission, CooldownConfig, CooldownOptions } from '@/types/commands'
import { getGuildConfig } from '@/services/guild'
import { devIds } from '@/config/env'

export interface PermissionContext {
  member: GuildMemberType | ChatInputCommandInteraction['member']
  guildId?: string | null
}

export async function hasPermission(
  context: PermissionContext,
  permission: CommandPermission | undefined
): Promise<boolean> {
  const { member } = context

  if (!member) return false
  if (!permission || permission === 'member') return true

  const memberId = member instanceof GuildMember ? member.id : member.user.id

  if (permission === 'dev') return devIds.has(memberId)

  const perms =
    typeof member.permissions === 'string'
      ? BigInt(member.permissions)
      : member.permissions.valueOf()

  const isAdmin =
    (BigInt(perms) & PermissionFlagsBits.Administrator) === PermissionFlagsBits.Administrator

  if (isAdmin) return true

  if (permission === 'admin') {
    return false
  }

  if (permission === 'staff') {
    const config = await getGuildConfig(context.guildId ?? undefined)

    if (config.staffRoleIds.length === 0) return false

    if (member instanceof GuildMember) {
      return member.roles.cache.some((role) => config.staffRoleIds.includes(role.id))
    }

    return member.roles.some((roleId) => config.staffRoleIds.includes(roleId))
  }

  return false
}

const cooldowns = new Map<string, Map<string, number>>()

export function validateCooldown(cooldown?: CooldownConfig): string | null {
  if (cooldown === undefined) return null

  if (typeof cooldown === 'number') {
    if (!Number.isFinite(cooldown) || cooldown <= 0) return 'Cooldown must be a positive number'
    return null
  }

  if (typeof cooldown !== 'object' || cooldown === null) {
    return 'Cooldown must be a number or object'
  }

  if (!Number.isFinite(cooldown.seconds) || cooldown.seconds <= 0) {
    return 'Cooldown seconds must be a positive number'
  }

  if (cooldown.scope !== undefined && !['user', 'guild', 'global'].includes(cooldown.scope)) {
    return 'Cooldown scope must be user, guild or global'
  }

  return null
}

export function resolveCooldown(cooldown?: CooldownConfig): Required<CooldownOptions> | null {
  if (cooldown === undefined) return null
  if (typeof cooldown === 'number') return { seconds: cooldown, scope: 'user' }
  return { seconds: cooldown.seconds, scope: cooldown.scope ?? 'user' }
}

export function checkCooldown(options: {
  command: string
  userId: string
  guildId?: string | null
  cooldown?: CooldownConfig
}): number | null {
  const { command, userId, guildId, cooldown } = options
  const resolved = resolveCooldown(cooldown)
  if (!resolved) return null
  const { seconds, scope } = resolved
  const bucket =
    scope === 'global'
      ? 'global'
      : scope === 'guild'
        ? `guild:${guildId ?? 'dm'}`
        : `user:${userId}`

  if (!cooldowns.has(command)) cooldowns.set(command, new Map())

  const timestamps = cooldowns.get(command)!
  const now = Date.now()
  const expiry = timestamps.get(bucket)

  if (expiry && now < expiry) return Math.ceil((expiry - now) / 1000)

  const expiresAt = now + seconds * 1000
  timestamps.set(bucket, expiresAt)

  const timer = setTimeout(() => {
    if (timestamps.get(bucket) === expiresAt) timestamps.delete(bucket)
  }, seconds * 1000)
  timer.unref?.()

  return null
}

export function clearCooldowns(): void {
  cooldowns.clear()
}
