import { Client, Collection, GatewayIntentBits } from 'discord.js'
import { token } from '@/config/env'
import loadCommands from '@/handlers/commands'
import loadEvents from '@/handlers/events'
import loadInteractions from '@/handlers/interactions'
import { registerLifecycleHandlers } from '@/utils/lifecycle'
import logger from '@/utils/logger'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
    // GatewayIntentBits.GuildMembers,
    // GatewayIntentBits.GuildPresences,
    // GatewayIntentBits.GuildMessageReactions,
    // GatewayIntentBits.GuildVoiceStates,
    // GatewayIntentBits.GuildModeration,
    // GatewayIntentBits.GuildInvites,
    // GatewayIntentBits.GuildScheduledEvents,
    // GatewayIntentBits.DirectMessages,
    // GatewayIntentBits.DirectMessageReactions
  ]
})

client.prefixCommands = new Collection()
client.slashCommands = new Collection()
client.contextMenuCommands = new Collection()
client.buttonHandlers = new Collection()
client.modalHandlers = new Collection()
client.selectMenuHandlers = new Collection()

registerLifecycleHandlers(client)

logger.info('Starting up...\n')

await loadCommands(client)
await loadInteractions(client)
await loadEvents(client)

console.log()
await client.login(token)
