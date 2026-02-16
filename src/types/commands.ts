import type {
  Client,
  ChatInputCommandInteraction,
  Message,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder
} from 'discord.js'

export type CommandCategory = 'general' // | Here you can add more categories like 'moderation', 'fun', etc.

export type CommandPermission = 'admin' | 'staff' | 'member'

export type AnySlashCommandBuilder =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder

export interface SlashCommand {
  data: AnySlashCommandBuilder
  permission?: CommandPermission
  category?: CommandCategory
  execute: (
    interaction: ChatInputCommandInteraction,
    client: Client
  ) => Promise<unknown>
}

export interface PrefixCommand {
  name?: string
  aliases?: string[]
  description?: string
  permission?: CommandPermission
  category?: CommandCategory
  execute: (
    message: Message,
    args: string[],
    client: Client
  ) => Promise<void>
}