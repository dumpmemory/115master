export const EVENTS = {
  PLAY: 'play',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LOADED: 'loaded',
  SEEKING: 'seeking',
  SEEKED: 'seeked',
  WAITING: 'waiting',
  TIMEOUT: 'timeout',
  CANPLAY: 'canplay',
  TIMEUPDATE: 'timeupdate',
  ENDED: 'ended',
  ERROR: 'error',
} as const satisfies Record<string, string>
