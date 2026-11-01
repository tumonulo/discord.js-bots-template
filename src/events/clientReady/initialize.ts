import mongoose from 'mongoose'
import { ActivityType } from 'discord.js'
import { Event } from '@/types/events'
import { mongoURL } from '@/config/env'
import { deployApplicationCommands } from '@/handlers/commands'
import logger from '@/utils/logger'

export default {
  once: true,

  async execute(client) {
    logger.success(`Logged in as ${client.user.tag}`)

    await deployApplicationCommands(client)

    try {
      await mongoose.connect(mongoURL, { serverSelectionTimeoutMS: 5_000 })
      logger.success('Database connected\n')
    } catch (error) {
      logger.fatal.bold('Database connection failed', {
        reason: error instanceof Error ? error.message : String(error)
      })
      await client.destroy()
      process.exit(1)
    }

    if (process.env.NODE_ENV === 'development') {
      logger.success('Watching for file changes...\n')
    }

    const activities = ['Template loaded']
    let activityIndex = 0

    client.user.setActivity({ name: activities[activityIndex], type: ActivityType.Custom })

    client.activityInterval = setInterval(
      () => {
        activityIndex = (activityIndex + 1) % activities.length
        client.user.setActivity({ name: activities[activityIndex], type: ActivityType.Custom })
      },
      1000 * 60 * 15
    ) // 15 minutes
  }
} satisfies Event<'clientReady'>
