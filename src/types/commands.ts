import type {
  Client,
  Message,
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  ContextMenuCommandBuilder
} from 'discord.js'

export type CommandPermission = 'dev' | 'admin' | 'staff' | 'member'
export type CommandCategory = never // Add your own categories here, e.g. 'moderation' | 'fun' | 'utility'

export type CooldownScope = 'user' | 'guild' | 'global'

export interface CooldownOptions {
  seconds: number
  scope?: CooldownScope
}

export type CooldownConfig = number | CooldownOptions

export interface PrefixCommand {
  execute: (message: Message, args: string[], client: Client) => Promise<unknown>
  cooldown?: CooldownConfig
  category?: CommandCategory
  aliases?: string[]
}

export interface PrefixCommandInstance extends PrefixCommand {
  name: string
  permission: CommandPermission
}

export type AnySlashCommandBuilder =
  SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder

export interface SlashCommand {
  data: AnySlashCommandBuilder
  execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<unknown>
  cooldown?: CooldownConfig
  category?: CommandCategory
}

export interface SlashCommandInstance extends SlashCommand {
  permission: CommandPermission
}

export interface ContextMenuCommand {
  data: ContextMenuCommandBuilder
  execute: (interaction: ContextMenuCommandInteraction, client: Client) => Promise<unknown>
  cooldown?: CooldownConfig
  category?: CommandCategory
}

export interface ContextMenuCommandInstance extends ContextMenuCommand {
  permission: CommandPermission
}
