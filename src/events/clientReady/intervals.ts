import type { Event } from '@/types/events'
import { runInterval } from '@/utils/interval'

export default {
  once: true,

  async execute(_client) {
    runInterval(
      [
        // () => someTask()
      ],
      1000 * 60 * 15
    )
  }
} satisfies Event<'clientReady'>
