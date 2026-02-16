import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Client } from 'discord.js'
import type { PrefixCommand, CommandPermission } from '@/types/commands'
import logger from '@/utils/logger'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface LoadError {
  file: string
  reason: string
}

export default async (client: Client): Promise<number> => {
  const baseDir = path.join(__dirname, '../prefixCommands')

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

    for (const file of files) {
      const fileName = file.replace('.ts', '')

      try {
        const { default: command } = await import(
          `../prefixCommands/${folder}/${file}`
        ) as { default: PrefixCommand }

        if (typeof command?.execute !== 'function') {
          errors.push({
            file: `${folder}/${fileName}`,
            reason: 'Invalid export (missing execute)'
          })
          continue
        }

        if (command.name) {
          logger.warn('Unnecessary name property', {
            commandType: 'prefix',
            file: `${folder}/${fileName}.ts`
          })
          continue
        }

        if (command.permission) {
          logger.warn('Unnecessary permission property', {
            commandType: 'prefix',
            file: `${folder}/${fileName}.ts`
          })
          continue
        }

        const finalCommand: PrefixCommand = {
          ...command,
          name: fileName,
          permission: folder as CommandPermission,
          category: command.category ?? 'general'
        }

        client.prefixCommands.set(fileName, finalCommand)

        if (Array.isArray(command.aliases)) {
          for (const alias of command.aliases) {
            client.prefixCommands.set(alias, finalCommand)
          }
        }

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
    logger.warn('No prefix commands found')
  } else if (loaded === 0) {
    logger.error(`0/${total} prefix ${total === 1 ? 'command' : 'commands'} loaded`)
  } else if (loaded === total) {
    logger.success(`${loaded}/${total} prefix ${total === 1 ? 'command' : 'commands'} loaded`)
  } else {
    logger.warn(`${loaded}/${total} prefix ${total === 1 ? 'command' : 'commands'} loaded`)
  }

  if (errors.length > 0) {
    errors.forEach(({ file, reason }) => {
      logger.warn('Failed to load prefix command', {
        file: `${file}.ts`,
        reason
      })
    })
  }

  return loaded
}