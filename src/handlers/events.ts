import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { Events, Client } from 'discord.js'
import logger from '@/utils/logger'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface LoadError {
  file: string
  reason: string
}

export default async (client: Client): Promise<number> => {
  const baseDir = path.join(__dirname, '../events')
  const eventTypes = fs
    .readdirSync(baseDir)
    .filter((f) => fs.statSync(path.join(baseDir, f)).isDirectory())

  let total = 0
  let loaded = 0
  const folderErrors: string[] = []
  const errors: LoadError[] = []

  await Promise.all(
    eventTypes.map(async (type) => {
      const eventKey = (Object.keys(Events) as Array<keyof typeof Events>).find(
        (key) => key === type.charAt(0).toUpperCase() + type.slice(1)
      )

      if (!eventKey) {
        folderErrors.push(type)
        return
      }

      const eventName = Events[eventKey]
      const eventDir = path.join(baseDir, type)
      const files = fs.readdirSync(eventDir).filter((f) => /\.(ts|js)$/.test(f))
      total += files.length

      await Promise.all(
        files.map(async (file) => {
          const fileName = `${type}/${file}`
          try {
            const modulePath = pathToFileURL(path.join(eventDir, file)).href
            const { default: event } = (await import(modulePath)) as {
              default: { once?: boolean; execute: (...args: any[]) => any }
            }

            if (typeof event?.execute !== 'function') {
              errors.push({
                file: fileName,
                reason: 'Invalid export (missing execute)'
              })
              return
            }

            const handler = (...args: any[]) => {
              void Promise.resolve()
                .then(() => event.execute(...args, client))
                .catch((error) => {
                  logger.error('Event handler failed', {
                    event: eventName,
                    file: fileName,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    at:
                      error instanceof Error
                        ? (error.stack?.split('\n')[1]?.match(/([^/]+:\d+:\d+)/)?.[1] ?? 'unknown')
                        : 'unknown'
                  })
                })
            }
            const emitter = client as unknown as {
              on: (event: string, handler: (...args: unknown[]) => void) => void
              once: (event: string, handler: (...args: unknown[]) => void) => void
            }

            if (event.once) emitter.once(eventName, handler)
            else emitter.on(eventName, handler)
            loaded++
          } catch (error) {
            errors.push({
              file: fileName,
              reason: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        })
      )
    })
  )

  if (total === 0) {
    logger.warn('No events found')
  } else if (loaded === 0) {
    logger.error(`0/${total} events loaded`)
  } else if (loaded === total) {
    logger.success(`${loaded}/${total} ${loaded === 1 ? 'event' : 'events'} loaded`)
  } else {
    logger.warn(`${loaded}/${total} ${loaded === 1 ? 'event' : 'events'} loaded`)
  }

  folderErrors.forEach((type) => {
    logger.warn('Unknown event type', { eventType: type })
  })

  errors.forEach(({ file, reason }) => {
    logger.warn('Failed to load event', {
      eventType: file.split('/')[0],
      file,
      reason
    })
  })

  return loaded
}
