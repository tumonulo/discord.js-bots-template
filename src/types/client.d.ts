import { Collection } from 'discord.js'
import type {
  PrefixCommandInstance,
  SlashCommandInstance,
  ContextMenuCommandInstance
} from '@/types/commands'
import type { ButtonHandler, ModalHandler, AnySelectMenuHandler } from '@/types/interactions'

declare module 'discord.js' {
  interface Client {
    prefixCommands: Collection<string, PrefixCommandInstance>
    slashCommands: Collection<string, SlashCommandInstance>
    contextMenuCommands: Collection<string, ContextMenuCommandInstance>
    buttonHandlers: Collection<string, ButtonHandler>
    modalHandlers: Collection<string, ModalHandler>
    selectMenuHandlers: Collection<string, AnySelectMenuHandler>
    activityInterval?: NodeJS.Timeout
  }
}
