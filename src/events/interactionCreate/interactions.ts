import { EmbedBuilder, type Client } from 'discord.js'
import type { Event } from '@/types/events'
import { resolveHandler } from '@/handlers/interactions'
import { parseCustomId, type InteractionParams } from '@/types/interactions'
import { checkCooldown } from '@/services/permissions'
import logger from '@/utils/logger'

export default {
  async execute(interaction, client) {
    const component =
      interaction.isButton() || interaction.isModalSubmit() || interaction.isAnySelectMenu()
        ? interaction
        : null

    if (!component) return

    try {
      const kind = component.isButton()
        ? 'button'
        : component.isModalSubmit()
          ? 'modal'
          : 'selectMenu'

      const handler =
        kind === 'button'
          ? resolveHandler(client.buttonHandlers, component.customId)
          : kind === 'modal'
            ? resolveHandler(client.modalHandlers, component.customId)
            : resolveHandler(client.selectMenuHandlers, component.customId)

      if (!handler) return

      const { base, params } = parseCustomId(component.customId)

      const remaining = checkCooldown({
        command: `${kind}:${base}`,
        userId: component.user.id,
        guildId: component.guildId,
        cooldown: handler.cooldown
      })

      if (remaining) {
        const embed = new EmbedBuilder()
          .setColor('Yellow')
          .setDescription(`Wait **${remaining}s** before using this again`)
        await component.reply({ embeds: [embed], ephemeral: true })
        return
      }

      const execute = handler.execute as (
        interaction: typeof component,
        params: InteractionParams,
        client: Client
      ) => Promise<void>

      await execute(component, params, client)
    } catch (error) {
      logger.error('Component handler failed', {
        type: component.type,
        customId: component.customId,
        user: component.user.tag,
        message: error instanceof Error ? error.message : 'Unknown error',
        at:
          error instanceof Error
            ? (error.stack?.split('\n')[1]?.match(/([^/]+:\d+:\d+)/)?.[1] ?? 'unknown')
            : 'unknown'
      })

      const embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('An error occurred while processing the interaction')

      const reply = { embeds: [embed] }

      try {
        if (component.replied || component.deferred) {
          await component.followUp(reply)
        } else {
          await component.reply(reply)
        }
      } catch (replyError) {
        logger.warn('Failed to send error reply for interaction', {
          customId: component.customId,
          reason: replyError instanceof Error ? replyError.message : 'Unknown error'
        })
      }
    }
  }
} satisfies Event<'interactionCreate'>
