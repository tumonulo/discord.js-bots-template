import mongoose from 'mongoose'

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  staffRoleIds: { type: [String], default: [] }
})

export type GuildDocument = mongoose.InferSchemaType<typeof guildSchema>

const Guild =
  (mongoose.models.Guild as mongoose.Model<GuildDocument>) ??
  mongoose.model<GuildDocument>('Guild', guildSchema)

export default Guild
