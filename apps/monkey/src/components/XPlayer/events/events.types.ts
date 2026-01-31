import type { EVENTS } from './events.const'
import type { PlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'

// eslint-disable-next-line ts/consistent-type-definitions
export type Events = {
  [EVENTS.PLAY]: PlayerContext
  [EVENTS.PLAYING]: PlayerContext
  [EVENTS.PAUSED]: PlayerContext
  [EVENTS.LOADED]: PlayerContext
  [EVENTS.SEEKING]: PlayerContext
  [EVENTS.SEEKED]: PlayerContext
  [EVENTS.WAITING]: PlayerContext
  [EVENTS.TIMEOUT]: PlayerContext
  [EVENTS.CANPLAY]: PlayerContext
  [EVENTS.TIMEUPDATE]: PlayerContext
  [EVENTS.ENDED]: PlayerContext
  [EVENTS.ERROR]: [ctx: PlayerContext, error: unknown]
}
