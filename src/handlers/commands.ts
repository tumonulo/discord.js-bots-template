import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { Client, PermissionFlagsBits } from 'discord.js'
import type { ApplicationCommand, Collection } from 'discord.js'
import {
  PrefixCommandInstance,
  SlashCommandInstance,
  ContextMenuCommandInstance,
  CommandPermission
} from '@/types/commands'
import { deployGlobal, guildId, devIds } from '@/config/env'
import { validateCooldown } from '@/services/permissions'
import logger from '@/utils/logger'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const permissionFolders: CommandPermission[] = ['dev', 'admin', 'staff', 'member']

type CommandType = 'prefix' | 'slash' | 'contextMenu'
type CommandJSON =
  | ReturnType<SlashCommandInstance['data']['toJSON']>
  | ReturnType<ContextMenuCommandInstance['data']['toJSON']>

type CommandManager = {
  fetch: () => Promise<Collection<string, ApplicationCommand>>
  set: (commands: CommandJSON[]) => Promise<unknown>
}

interface LoadedCommand {
  fileName: string
  filePath: string
  command: any
  permission: CommandPermission
  aliases?: string[]
}
interface LoadError {
  file: string
  reason: string
}

export default async (client: Client): Promise<void> => {
  const prefix = await loadCommands('prefix')
  for (const { fileName, command, permission, aliases } of prefix) {
    const instance: PrefixCommandInstance = {
      ...command,
      name: fileName,
      permission,
      aliases
    }
    client.prefixCommands.set(fileName.toLowerCase(), instance)
    if (aliases) {
      for (const alias of aliases) client.prefixCommands.set(alias.toLowerCase(), instance)
    }
  }

  const slash = await loadCommands('slash')
  for (const { command, permission } of slash) {
    if (permission === 'admin')
      command.data.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    client.slashCommands.set(command.data.name, {
      ...command,
      permission
    } as SlashCommandInstance)
  }

  const contextMenu = await loadCommands('contextMenu')
  for (const { command, permission } of contextMenu) {
    if (permission === 'admin')
      command.data.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    client.contextMenuCommands.set(command.data.name, {
      ...command,
      permission
    } as ContextMenuCommandInstance)
  }

  client.once('clientReady', async () => {
    try {
      await deployApplicationCommands(client)
      logger.success('Application commands deployed')
    } catch (error) {
      logger.error('Command deployment failed', {
        reason: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
}

async function loadCommands(type: CommandType): Promise<LoadedCommand[]> {
  const baseDir = path.join(__dirname, `../commands/${type}`)
  if (!fs.existsSync(baseDir)) {
    logger.warn(`No ${type} commands found`)
    return []
  }

  const results: LoadedCommand[] = []
  const errors: LoadError[] = []
  const folders = getFolders(baseDir).filter((f) =>
    permissionFolders.includes(f as CommandPermission)
  )
  const total = folders.reduce((acc, f) => acc + getCommandFiles(path.join(baseDir, f)).length, 0)

  for (const folder of folders) {
    const permission = folder as CommandPermission
    await Promise.all(
      getCommandFiles(path.join(baseDir, folder)).map(async (file) => {
        const fileName = file.replace(/\.(ts|js)$/, '')
        const filePath = `${type}/${folder}/${fileName}${path.extname(file)}`
        try {
          const { default: command } = await import(
            pathToFileURL(path.join(baseDir, folder, file)).href
          )
          const error = validate(command, type, fileName)
          if (error) {
            errors.push({ file: filePath, reason: error })
            return
          }
          results.push({ fileName, filePath, command, permission })
        } catch (error) {
          errors.push({
            file: filePath,
            reason: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })
    )
  }

  const unique = dedupeCommands(type, results, errors)

  errors.forEach(({ file, reason }) =>
    logger.warn(`Failed to load ${type} command`, { file, reason })
  )

  const loaded = unique.length
  const label = total === 1 ? 'command' : 'commands'
  if (total === 0) logger.info(`No ${type} commands found`)
  else if (loaded === 0) logger.error(`0/${total} ${type} ${label} loaded`)
  else if (loaded === total) logger.success(`${loaded}/${total} ${type} ${label} loaded`)
  else logger.warn(`${loaded}/${total} ${type} ${label} loaded`)

  return unique
}

export function validate(command: any, type: CommandType, fileName: string): string | null {
  if (typeof command?.execute !== 'function') return 'Missing execute function'

  const cooldownError = validateCooldown(command.cooldown)
  if (cooldownError) return cooldownError

  if (type === 'prefix') {
    if (command.aliases !== undefined) {
      if (!Array.isArray(command.aliases) || command.aliases.length === 0)
        return 'Aliases must be a non-empty array'
      if (command.aliases.some((a: any) => typeof a !== 'string' || a.trim() === ''))
        return 'Aliases must be non-empty strings'
    }
  }

  if (type !== 'prefix') {
    if (!command.data) return 'Missing data builder'
    if (typeof command.data.setDefaultMemberPermissions !== 'function')
      return 'Data is not a valid discord.js builder'

    const normalize = (s: string) =>
      s
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-\s]/g, '')
        .toLowerCase()

    if (
      type === 'contextMenu'
        ? normalize(command.data.name) !== normalize(fileName)
        : command.data.name !== fileName
    )
      return 'Name mismatch with file'

    const json = command.data.toJSON()
    if (json.default_member_permissions !== null && json.default_member_permissions !== undefined) {
      return 'Manual permissions detected, use the folder structure instead'
    }
  }

  return null
}

function dedupeCommands(
  type: CommandType,
  commands: LoadedCommand[],
  errors: LoadError[]
): LoadedCommand[] {
  const sorted = [...commands].sort((a, b) => a.filePath.localeCompare(b.filePath))
  const names = new Map<string, string>()
  const unique: LoadedCommand[] = []

  for (const entry of sorted) {
    const name = type === 'prefix' ? entry.fileName.toLowerCase() : entry.command.data.name
    const owner = names.get(name)

    if (owner) {
      errors.push({
        file: entry.filePath,
        reason: `Duplicate command name "${name}" (already used by ${owner})`
      })
      continue
    }

    names.set(name, entry.filePath)
    unique.push(entry)
  }

  if (type !== 'prefix') return unique

  return unique.map((entry) => {
    const commandName = entry.fileName.toLowerCase()
    const aliases = entry.command.aliases as string[] | undefined
    if (!aliases) return entry

    const accepted: string[] = []

    for (const alias of aliases) {
      const aliasName = alias.toLowerCase()

      if (aliasName === commandName) continue

      const owner = names.get(aliasName)
      if (owner) {
        errors.push({
          file: entry.filePath,
          reason: `Duplicate alias "${aliasName}" (already used by ${owner})`
        })
        continue
      }

      names.set(aliasName, entry.filePath)
      accepted.push(alias)
    }

    return { ...entry, aliases: accepted }
  })
}

function getFolders(dir: string): string[] {
  return fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isDirectory())
}

function getCommandFiles(dir: string): string[] {
  return fs.readdirSync(dir).filter((f) => /\.(ts|js)$/.test(f))
}

async function deployApplicationCommands(client: Client): Promise<void> {
  const commands = [...client.slashCommands.values(), ...client.contextMenuCommands.values()]

  const publicCommands = commands
    .filter(({ permission }) => permission !== 'dev')
    .map(({ data }) => data.toJSON())
  const devCommands = commands.filter(({ permission }) => permission === 'dev')

  if (devCommands.length > 0 && devIds.size === 0) {
    logger.warn('Dev commands found but DEV_IDS is empty; skipping them')
  }

  const deployableDevCommands = devIds.size > 0 ? devCommands.map(({ data }) => data.toJSON()) : []

  const application = client.application

  if (deployGlobal) {
    if (!application) {
      logger.error('Cannot deploy commands: application is not available')
      return
    }

    const deployed = await syncCommands(application.commands, publicCommands)
    logger.info(
      deployed
        ? 'Application commands deployed globally'
        : 'Global application commands are up to date'
    )

    if (!guildId) {
      if (deployableDevCommands.length > 0) {
        logger.warn('Dev commands were skipped: GUILD_ID is not set')
      }
      return
    }

    try {
      const guild = await client.guilds.fetch(guildId)
      const changed = await syncCommands(guild.commands, deployableDevCommands)

      if (changed) {
        logger.info(
          deployableDevCommands.length > 0
            ? 'Dev commands deployed to guild'
            : 'Removed guild-specific commands',
          { guildId }
        )
      } else if (deployableDevCommands.length > 0) {
        logger.info('Guild dev commands are up to date', { guildId })
      }
    } catch (error) {
      logger.warn('Could not sync dev commands', {
        guildId,
        reason: error instanceof Error ? error.message : String(error)
      })
    }

    return
  }

  if (!guildId) {
    logger.error('GUILD_ID is required when DEPLOY_GLOBAL is false')
    return
  }

  const guild = await client.guilds.fetch(guildId)
  const deployed = await syncCommands(guild.commands, [...publicCommands, ...deployableDevCommands])
  logger.info(
    deployed
      ? 'Application commands deployed to guild'
      : 'Guild application commands are up to date',
    { guildId }
  )

  if (application) {
    try {
      if (await syncCommands(application.commands, [])) {
        logger.info('Removed global application commands')
      }
    } catch (error) {
      logger.warn('Could not remove global application commands', {
        reason: error instanceof Error ? error.message : String(error)
      })
    }
  }
}

async function syncCommands(manager: CommandManager, commands: CommandJSON[]): Promise<boolean> {
  const existing = await manager.fetch()

  if (existing.size === commands.length) {
    const current = new Map(existing.map((command) => [`${command.type}:${command.name}`, command]))

    const upToDate = commands.every((data) => {
      const command = current.get(`${data.type}:${data.name}`)
      if (!command) return false
      return command.equals(
        stripUndefined({
          ...data,
          integration_types: data.integration_types ?? command.integrationTypes ?? undefined,
          contexts: data.contexts ?? command.contexts ?? undefined
        }) as Parameters<ApplicationCommand['equals']>[0]
      )
    })

    if (upToDate) return false
  }

  await manager.set(commands)
  return true
}

function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}
