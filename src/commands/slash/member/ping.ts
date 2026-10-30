import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import type { SlashCommand } from '@/types/commands'

export default {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check the bot latency'),

  async execute(interaction) {
    const start = Date.now()
    await interaction.deferReply()
    const latency = Date.now() - start
    const apiLatency = Math.round(interaction.client.ws.ping)

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('Blue')
          .setTitle('🏓 Pong!')
          .addFields(
            { name: 'Latency', value: `${latency}ms`, inline: true },
            { name: 'API', value: `${apiLatency}ms`, inline: true }
          )
      ]
    })
  }
} satisfies SlashCommand
