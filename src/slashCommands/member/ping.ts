import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import type { SlashCommand } from '@/types/commands'

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ver latencia del bot'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Calculando latencia...' })
    
    const latency = sent.createdTimestamp - interaction.createdTimestamp
    const apiLatency = Math.round(interaction.client.ws.ping)
    
    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'Latencia', value: `${latency}ms`, inline: true },
        { name: 'API', value: `${apiLatency}ms`, inline: true }
      )

    await interaction.editReply({ content: null, embeds: [embed] })
  }
} satisfies SlashCommand