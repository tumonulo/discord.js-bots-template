import mongoose from 'mongoose'
import type { Client } from 'discord.js'
import logger from '@/utils/logger'

let isShuttingDown = false

async function shutdown(client: Client, signal: string, exitCode = 0): Promise<void> {
  if (isShuttingDown) return
  isShuttingDown = true

  logger.info(`Received ${signal}, shutting down...`)

  const forceExit = setTimeout(() => {
    logger.warn('Shutdown timed out, forcing exit')
    process.exit(1)
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

    logger.success('Shutdown complete')
    process.exit(exitCode)
  } catch (error) {
    logger.error('Error during shutdown', {
      reason: error instanceof Error ? error.message : String(error)
    })
    process.exit(1)
  }
}

export function registerLifecycleHandlers(client: Client): void {
  process.once('SIGINT', () => void shutdown(client, 'SIGINT'))
  process.once('SIGTERM', () => void shutdown(client, 'SIGTERM'))

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
    void shutdown(client, 'uncaughtException', 1)
  })
}
