import 'dotenv/config'
import { z } from 'zod'
import logger from '@/utils/logger'

const snowflake = z.string().regex(/^\d{17,19}$/, 'Must be a Discord snowflake (17-19 digits)')

const envSchema = z
  .object({
    TOKEN: z.string().min(10, 'TOKEN looks too short'),
    PREFIX: z.string().min(1, 'PREFIX cannot be empty'),
    DEV_IDS: z
      .string()
      .default('')
      .transform((value) => value.split(/[\s,]+/).filter(Boolean))
      .refine(
        (ids) => ids.every((id) => snowflake.safeParse(id).success),
        'DEV_IDS must be a comma-separated list of Discord user IDs'
      )
      .transform((ids) => new Set(ids)),
    MONGO_URL: z
      .string()
      .regex(/^mongodb(\+srv)?:\/\/.+/, 'MONGO_URL must start with mongodb:// or mongodb+srv://'),
    DEPLOY_GLOBAL: z.stringbool().default(false),
    GUILD_ID: z.preprocess((value) => (value === '' ? undefined : value), snowflake.optional())

    // Add your own variables here:
    // API_KEY: z.string().min(1)
  })
  .superRefine((env, ctx) => {
    if (!env.DEPLOY_GLOBAL && !env.GUILD_ID) {
      ctx.addIssue({
        code: 'custom',
        path: ['GUILD_ID'],
        message: 'GUILD_ID is required when DEPLOY_GLOBAL is false'
      })
    }
  })

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  for (const issue of parsed.error.issues) {
    logger.fatal.bold(`Environment variable ${issue.path.join('.')} invalid`, {
      reason: issue.message
    })
  }
  process.exit(1)
}

export const {
  TOKEN: token,
  PREFIX: prefix,
  DEV_IDS: devIds,
  MONGO_URL: mongoURL,
  DEPLOY_GLOBAL: deployGlobal,
  GUILD_ID: guildId
} = parsed.data
