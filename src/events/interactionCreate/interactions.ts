import { EmbedBuilder } from 'discord.js'
import type { Event } from '@/types/events'
import logger from '@/utils/logger'

async function loadHandler(path: string, customId: string) {
  // Try exact match
  try {
    const handler = await import(`@/interactions/${path}/${customId}.ts`)
    return handler.default
  } catch {
    // Try dynamic match (prefix before ":")
    if (customId.includes(':')) {
      const prefix = customId.split(':')[0]
      try {
        const handler = await import(`@/interactions/${path}/${prefix}.ts`)
        return handler.default
      } catch {}
    }
  }
  return null
}

export default {
  async execute(interaction, client) {
    try {
      let handler = null
      let folder = ''
      let id = ''

      if (interaction.isButton()) {
        folder = 'buttons'
        id = interaction.customId
      } else if (interaction.isModalSubmit()) {
        folder = 'modals'
        id = interaction.customId
      } else if (interaction.isAnySelectMenu()) {
        folder = 'selectMenus'
        id = interaction.customId
      }

      if (folder) {
        handler = await loadHandler(folder, id)
      }

      if (!handler) return

      await handler.execute(interaction, client)
    } catch (error) {
      logger.error('Component handler failed', {
        type: interaction.type,
        customId: 'customId' in interaction ? interaction.customId : 'unknown',
        user: interaction.user.tag,
        message: error instanceof Error ? error.message : 'Unknown error',
        at: error instanceof Error
          ? error.stack?.split('\n')[1]?.match(/([^/]+:\d+:\d+)/)?.[1] ?? 'unknown'
          : 'unknown'
      })

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('Ocurrió un error al procesar la interacción')

      const reply = { embeds: [embed], ephemeral: true }

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {})
      } else {
        await interaction.reply(reply).catch(() => {})
      }
    }
  }
} satisfies Event<'interactionCreate'>