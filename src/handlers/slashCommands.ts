import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Client, PermissionFlagsBits } from 'discord.js'
import type { SlashCommand, CommandPermission } from '@/types/commands'
import { guildId } from '@/config/bot'
import logger from '@/utils/logger'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface LoadError {
  file: string
  reason: string
}

const folderPermissions: Record<string, bigint | null> = {
  admin: PermissionFlagsBits.Administrator,
  staff: null,
  member: null
}

export default async (client: Client): Promise<number> => {
  const baseDir = path.join(__dirname, '../slashCommands')

  const folders = fs.readdirSync(baseDir).filter(f =>
    fs.statSync(path.join(baseDir, f)).isDirectory()
  )

  let loaded = 0
  const errors: LoadError[] = []

  for (const folder of folders) {
    const folderDir = path.join(baseDir, folder)

    const files = fs
      .readdirSync(folderDir)
      .filter(f => f.endsWith('.ts'))

    if (!folderPermissions.hasOwnProperty(folder)) {
      logger.warn('Unknown slash command folder', { folder })
      continue
    }

    for (const file of files) {
      const fileName = file.replace('.ts', '')

      try {
        const { default: command } = await import(
          `../slashCommands/${folder}/${file}`
        ) as { default: SlashCommand }

        if (!command?.data || typeof command?.execute !== 'function') {
          errors.push({
            file: `${folder}/${fileName}`,
            reason: 'Invalid export (missing data or execute)'
          })
          continue
        }

        const commandName = command.data.name

        if (commandName !== fileName) {
          logger.warn('Name mismatch', {
            commandType: 'slash',
            file: `${folder}/${fileName}.ts`,
            exports: commandName
          })
          continue
        }

        const hasManualPermission =
          command.data.default_member_permissions !== undefined

        if (hasManualPermission) {
          logger.warn('Slash command should not define permissions manually', {
            file: `${folder}/${fileName}.ts`
          })
          continue
        }

        if (folder === 'admin') {
          command.data.setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
          )
        }

        const finalCommand: SlashCommand = {
          ...command,
          permission: folder as CommandPermission,
          category: command.category ?? 'general'
        }

        client.slashCommands.set(commandName, finalCommand)

        loaded++
      } catch (error) {
        errors.push({
          file: `${folder}/${fileName}`,
          reason: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  const total = folders.reduce((acc, folder) => {
    return (
      acc +
      fs
        .readdirSync(path.join(baseDir, folder))
        .filter(f => f.endsWith('.ts')).length
    )
  }, 0)

  if (total === 0) {
    logger.warn('No slash commands found')
  } else if (loaded === 0) {
    logger.error(`0/${total} slash ${total === 1 ? 'command' : 'commands'} loaded`)
  } else if (loaded === total) {
    logger.success(`${loaded}/${total} slash ${total === 1 ? 'command' : 'commands'} loaded`)
  } else {
    logger.warn(`${loaded}/${total} slash ${total === 1 ? 'command' : 'commands'} loaded`)
  }

  if (errors.length > 0) {
    errors.forEach(({ file, reason }) => {
      logger.warn('Failed to load slash command', {
        file: `${file}.ts`,
        reason
      })
    })
  }

  client.once('clientReady', async () => {
    try {
      await deployCommands(client)
    } catch (error) {
      logger.error('Command deployment failed', {
        reason: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  return loaded
}

async function deployCommands(client: Client): Promise<void> {
  const commands = Array.from(client.slashCommands.values())
    .map(cmd => cmd.data.toJSON())

  const guild = await client.guilds.fetch(guildId)

  await guild.commands.set(commands)
}