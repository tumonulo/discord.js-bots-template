import { SlashCommandBuilder, EmbedBuilder, type ColorResolvable } from 'discord.js'
import type { SlashCommand } from '@/types/commands'
import { getGuildConfig, addStaffRole, removeStaffRole } from '@/services/guild'

export default {
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Manage staff roles')
    .addStringOption((opt) =>
      opt
        .setName('operation')
        .setDescription('Operation to perform (defaults to view)')
        .addChoices(
          { name: 'View', value: 'view' },
          { name: 'Add', value: 'add' },
          { name: 'Remove', value: 'remove' }
        )
    )
    .addRoleOption((opt) => opt.setName('role').setDescription('Role to add or remove')),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: 'This command can only be used in servers.'
      })
    }

    const guildId = interaction.guild.id
    const operation = interaction.options.getString('operation') ?? 'view'

    const replyEmbed = (
      color: ColorResolvable,
      description: string,
      title: string | null = null
    ) => {
      const embed = new EmbedBuilder().setColor(color).setDescription(description)

      if (title) embed.setTitle(title)

      return interaction.reply({ embeds: [embed] })
    }

    if (operation === 'view') {
      const config = await getGuildConfig(guildId)

      if (config.staffRoleIds.length === 0) {
        return replyEmbed('Blue', 'No roles configured.', 'Staff')
      }

      const roles = config.staffRoleIds.map((id) => `- <@&${id}>`).join('\n')

      return replyEmbed('Blue', roles, 'Staff roles')
    }

    const role = interaction.options.getRole('role', false)

    if (!role) {
      return replyEmbed('Red', 'You must specify a role for this operation.')
    }

    if (operation === 'add') {
      const config = await getGuildConfig(guildId)

      if (config.staffRoleIds.includes(role.id)) {
        return replyEmbed('Red', `${role} role is already configured.`)
      }

      await addStaffRole(role.id, guildId)

      return replyEmbed('Green', `${role} role added to staff roles.`)
    }

    if (operation === 'remove') {
      const config = await getGuildConfig(guildId)

      if (!config.staffRoleIds.includes(role.id)) {
        return replyEmbed('Red', `${role} role is not configured.`)
      }

      await removeStaffRole(role.id, guildId)

      return replyEmbed('Green', `${role} role removed from staff roles.`)
    }

    return replyEmbed('Red', 'Unknown operation. Use view, add or remove.')
  }
} satisfies SlashCommand
