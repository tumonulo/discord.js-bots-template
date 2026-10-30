import { EmbedBuilder } from 'discord.js'
import type { Event } from '@/types/events'
import { hasPermission, checkCooldown } from '@/services/permissions'
import logger from '@/utils/logger'

const PERMISSION_MESSAGES: Record<string, string | null> = {
  dev: 'This command is restricted to developers',
  admin: 'This command requires Administrator permissions',
  staff: 'This command requires a staff role',
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
        .setColor('Red')
        .setDescription(
          PERMISSION_MESSAGES[command.permission] ??
            'You do not have permission to use this command'
        )
      await interaction.reply({ embeds: [embed] })
      return
    }

    const remaining = checkCooldown({
      command: interaction.commandName,
      userId: interaction.user.id,
      guildId: interaction.guildId,
      cooldown: command.cooldown
    })
    if (remaining) {
      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setDescription(`Wait **${remaining}s** before using this command again`)
      await interaction.reply({ embeds: [embed] })
      return
    }

    try {
      await command.execute(interaction, client)
    } catch (error) {
      logger.error('Slash command failed', {
        command: interaction.commandName,
        user: interaction.user.tag,
        message: error instanceof Error ? error.message : 'Unknown error',
        at:
          error instanceof Error
            ? (error.stack?.split('\n')[1]?.match(/([^/]+:\d+:\d+)/)?.[1] ?? 'unknown')
            : 'unknown'
      })

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('An error occurred while executing the command')

      const reply = { embeds: [embed] }
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply)
      } else {
        await interaction.reply(reply)
      }
    }
  }
} satisfies Event<'interactionCreate'>
