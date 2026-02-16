import { EmbedBuilder, Message, Client } from 'discord.js'
import type { Event } from '@/types/events'
import { hasPermission, type PermissionContext } from '@/services/permissions'
import { prefix } from '@/config/bot'
import logger from '@/utils/logger'

const PERMISSION_MESSAGES: Record<string, string | null> = {
  admin: 'Este comando requiere permisos de Administrador para ser utilizado',
  staff: 'Este comando require tener un rol de staff para ser utilizado',
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
      member: message.member
    }

    const allowed = await hasPermission(context, command.permission)

    if (!allowed) {
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setDescription(
          (command.category ? PERMISSION_MESSAGES[command.category] : null)
          ?? 'No tienes permisos para usar este comando'
        )

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
        .setColor(0xED4245)
        .setDescription('Ocurrió un error al ejecutar este comando')

      await message.reply({ embeds: [embed] })
    }
  }
} satisfies Event<'messageCreate'>