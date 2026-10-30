import { EmbedBuilder, Message, Client } from 'discord.js'
import type { Event } from '@/types/events'
import { hasPermission, checkCooldown, type PermissionContext } from '@/services/permissions'
import { prefix } from '@/config/env'
import logger from '@/utils/logger'

const PERMISSION_MESSAGES: Record<string, string | null> = {
  dev: 'This command is restricted to developers',
  admin: 'This command requires Administrator permissions',
  staff: 'This command requires a staff role',
  member: null
}

export default {
  async execute(message: Message, client: Client): Promise<void> {
    if (message.author.bot || !message.guild) return
    if (!message.content.startsWith(prefix)) return

    const args = message.content.slice(prefix.length).trim().split(/ +/)
    const commandName = args.shift()?.toLowerCase()
    if (!commandName) return

    const command = client.prefixCommands.get(commandName)
    if (!command) return

    const context: PermissionContext = {
      member: message.member,
      guildId: message.guildId
    }

    const allowed = await hasPermission(context, command.permission)
    if (!allowed) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(
          PERMISSION_MESSAGES[command.permission] ??
            'You do not have permission to use this command'
        )
      await message.reply({ embeds: [embed] })
      return
    }

    const remaining = checkCooldown({
      command: command.name,
      userId: message.author.id,
      guildId: message.guildId,
      cooldown: command.cooldown
    })
    if (remaining) {
      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setDescription(`Wait **${remaining}s** before using this command again`)
      await message.reply({ embeds: [embed] })
      return
    }

    try {
      await command.execute(message, args, client)
    } catch (error) {
      logger.error('Prefix command failed', {
        command: commandName,
        message: error instanceof Error ? error.message : 'Unknown error'
      })

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('An error occurred while executing this command')

      await message.reply({ embeds: [embed] })
    }
  }
} satisfies Event<'messageCreate'>
