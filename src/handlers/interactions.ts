import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import type { Client } from 'discord.js'
import type { InteractionHandlerKind } from '@/types/interactions'
import { parseCustomId } from '@/types/interactions'
import { validateCooldown } from '@/services/permissions'
import logger from '@/utils/logger'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const HANDLER_FOLDERS: InteractionHandlerKind[] = ['buttons', 'modals', 'selectMenus']

interface LoadedHandler {
  customId: string
  handler: any
}

export default async function loadInteractions(client: Client): Promise<void> {
  for (const folder of HANDLER_FOLDERS) {
    const loaded = await loadFolder(folder)

    for (const { customId, handler } of loaded) {
      if (folder === 'buttons') client.buttonHandlers.set(customId, handler)
      else if (folder === 'modals') client.modalHandlers.set(customId, handler)
      else client.selectMenuHandlers.set(customId, handler)
    }
  }
}

async function loadFolder(folder: InteractionHandlerKind): Promise<LoadedHandler[]> {
  const dir = path.join(__dirname, `../interactions/${folder}`)
  if (!fs.existsSync(dir)) {
    logger.info(`No ${folder} handlers found`)
    return []
  }

  const files = fs.readdirSync(dir).filter((f) => /\.(ts|js)$/.test(f))
  const results: LoadedHandler[] = []
  let loaded = 0

  await Promise.all(
    files.map(async (file) => {
      const customId = file.replace(/\.(ts|js)$/, '')
      const fileLabel = `${folder}/${file}`
      try {
        const { default: handler } = await import(pathToFileURL(path.join(dir, file)).href)
        const error = validateHandler(handler)
        if (error) {
          logger.warn('Failed to load interaction handler', {
            file: fileLabel,
            reason: error
          })
          return
        }
        if (results.some((r) => r.customId === customId)) {
          logger.warn('Failed to load interaction handler', {
            file: fileLabel,
            reason: `Duplicate customId "${customId}"`
          })
          return
        }
        results.push({ customId, handler })
        loaded++
      } catch (error) {
        logger.warn('Failed to load interaction handler', {
          file: fileLabel,
          reason: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    })
  )

  const label = files.length === 1 ? 'handler' : 'handlers'
  if (files.length === 0) logger.info(`No ${folder} handlers found`)
  else if (loaded === files.length)
    logger.success(`${loaded}/${files.length} ${folder} ${label} loaded`)
  else if (loaded === 0) logger.error(`0/${files.length} ${folder} ${label} loaded`)
  else logger.warn(`${loaded}/${files.length} ${folder} ${label} loaded`)

  return results
}

export function validateHandler(handler: any): string | null {
  if (!handler || typeof handler !== 'object') return 'Default export must be an object'
  if (typeof handler.execute !== 'function') return 'Missing execute function'

  const cooldownError = validateCooldown(handler.cooldown)
  if (cooldownError) return cooldownError

  return null
}

export function resolveHandler<T>(collection: Map<string, T>, customId: string): T | null {
  return collection.get(parseCustomId(customId).base) ?? null
}
