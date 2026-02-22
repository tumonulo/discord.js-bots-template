import 'dotenv/config'
import logger from '@/utils/logger'

const requiredEnv = ['TOKEN', 'MONGO_URL', 'GUILD_ID', 'PREFIX'] as const

for (const key of requiredEnv) {
  if (!process.env[key]) {
    logger.fatal.bold(`Environment variable ${key} not defined`)
    process.exit(1)
  }
}

export const token = process.env.TOKEN!
export const mongoURL = process.env.MONGO_URL!
export const guildId = process.env.GUILD_ID!
export const prefix = process.env.PREFIX!