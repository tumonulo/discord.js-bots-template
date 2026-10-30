import mongoose from 'mongoose'

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  staffRoleIds: { type: [String], default: [] }
})

export type GuildDocument = mongoose.InferSchemaType<typeof guildSchema>
export default mongoose.model('Guild', guildSchema)
