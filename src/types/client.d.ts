import { Collection } from 'discord.js'
import type { SlashCommand, PrefixCommand } from '@/types/commands'

declare module 'discord.js' {
  interface Client {
    slashCommands: Collection<string, SlashCommand>
    prefixCommands: Collection<string, PrefixCommand>
  }
}