import { EmbedBuilder } from 'discord.js'
import type { PrefixCommand } from '@/types/commands'

export default {
  aliases: ['p'],

  async execute(message, args, client) {
    const sent = await message.reply('Calculando latencia...')
    const latency = sent.createdTimestamp - message.createdTimestamp
    const apiLatency = Math.round(message.client.ws.ping)

    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'Latencia', value: `${latency}ms`, inline: true },
        { name: 'API', value: `${apiLatency}ms`, inline: true }
      )

    await sent.edit({ content: null, embeds: [embed] })
  }
} satisfies PrefixCommand