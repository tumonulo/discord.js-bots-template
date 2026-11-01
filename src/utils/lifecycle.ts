import mongoose from 'mongoose'
import type { Client } from 'discord.js'
import logger from '@/utils/logger'

let isShuttingDown = false

async function shutdown(client: Client, exitCode = 0): Promise<void> {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info('\nShutting down...')

  const forceExit = setTimeout(() => {
    logger.warn('\nShutdown timed out, forcing exit\n')
    setTimeout(() => process.exit(1), 50)
  }, 10_000)
  forceExit.unref()

  try {
    if (client.activityInterval) {
      clearInterval(client.activityInterval)
      client.activityInterval = undefined
    }

    await client.destroy()

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect()
    }

    clearTimeout(forceExit)
    process.exitCode = exitCode
  } catch (error) {
    logger.error('Error during shutdown', {
      reason: error instanceof Error ? error.message : String(error)
    })
    process.exitCode = 1
  }
}

export function registerLifecycleHandlers(client: Client): void {
  process.once('SIGINT', () => void shutdown(client))
  process.once('SIGTERM', () => void shutdown(client))

  process.on('unhandledRejection', (error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error))

    logger.error.bold('Unhandled rejection', {
      message: err.message,
      at: err.stack?.split('\n')[1]?.match(/([^/]+:\d+:\d+)/)?.[1] || 'unknown'
    })
  })

  process.on('uncaughtException', (error) => {
    logger.fatal.bold('Uncaught exception', {
      message: error?.message,
      at: error?.stack?.split('\n')[1]?.match(/([^/]+:\d+:\d+)/)?.[1] || 'unknown'
    })
    void shutdown(client, 1)
  })
}
