import type { CooldownConfig } from '@/types/commands'
import type {
  ButtonInteraction,
  ModalSubmitInteraction,
  AnySelectMenuInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  RoleSelectMenuInteraction,
  MentionableSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  Client
} from 'discord.js'

export type InteractionParams = string[]

export interface InteractionHandler<T> {
  execute: (interaction: T, params: InteractionParams, client: Client) => Promise<void>
  cooldown?: CooldownConfig
}

export type ButtonHandler = InteractionHandler<ButtonInteraction>
export type ModalHandler = InteractionHandler<ModalSubmitInteraction>
export type SelectMenuHandler = InteractionHandler<AnySelectMenuInteraction>
export type StringSelectMenuHandler = InteractionHandler<StringSelectMenuInteraction>
export type UserSelectMenuHandler = InteractionHandler<UserSelectMenuInteraction>
export type RoleSelectMenuHandler = InteractionHandler<RoleSelectMenuInteraction>
export type MentionableSelectMenuHandler = InteractionHandler<MentionableSelectMenuInteraction>
export type ChannelSelectMenuHandler = InteractionHandler<ChannelSelectMenuInteraction>

export type AnySelectMenuHandler =
  | SelectMenuHandler
  | StringSelectMenuHandler
  | UserSelectMenuHandler
  | RoleSelectMenuHandler
  | MentionableSelectMenuHandler
  | ChannelSelectMenuHandler

export type InteractionHandlerKind = 'buttons' | 'modals' | 'selectMenus'

export interface ParsedCustomId {
  base: string
  params: string[]
}

// Positional customIds: `ticket:123:staff` -> base `ticket`, params `['123', 'staff']`.
export function parseCustomId(customId: string): ParsedCustomId {
  const [base, ...params] = customId.split(':')
  return { base, params }
}

export function resolveBaseCustomId(customId: string): string {
  return parseCustomId(customId).base
}
