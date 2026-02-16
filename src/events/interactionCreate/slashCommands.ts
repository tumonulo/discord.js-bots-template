import { EmbedBuilder } from 'discord.js'
import type { Event } from '@/types/events'
import { hasPermission } from '@/services/permissions'
import logger from '@/utils/logger'

const PERMISSION_MESSAGES: Record<string, string | null> = {
  admin: 'Este comando requiere permisos de Administrador para ser utilizado',
  staff: 'Este comando require tener un rol de staff para ser utilizado',
  member: null
}

export default {
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return

    const command = client.slashCommands.get(interaction.commandName)
    if (!command) return

    const allowed = await hasPermission(interaction, command.permission)

    if (!allowed) {
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setDescription(
          (command.category ? PERMISSION_MESSAGES[command.category] : null)
          ?? 'No tienes permisos para utilizar este comando'
        )

      await interaction.reply({ embeds: [embed], ephemeral: true })
      return
    }

    try {
      await command.execute(interaction, client)
    } catch (error) {
      logger.error('Command failed', {
        command: interaction.commandName,
        user: interaction.user.tag,
        message: error instanceof Error ? error.message : 'Unknown error',
        at: error instanceof Error
          ? error.stack?.split('\n')[1]?.match(/([^/]+:\d+:\d+)/)?.[1] ?? 'unknown'
          : 'unknown'
      })

      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setDescription('Ocurrió un error a la hora de ejecutar el comando')

      const reply = { embeds: [embed], ephemeral: true }

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply)
      } else {
        await interaction.reply(reply)
      }
    }
  }
} satisfies Event<'interactionCreate'>