import mitt from 'mitt'

export class EventMitt<E extends Record<string, unknown>> {
  emitter = mitt<E>()
  constructor() {
  }

  on<K extends keyof E>(event: K, callback: (data: E[K]) => void) {
    this.emitter.on(event, callback)
  }

  emit<K extends keyof E>(event: K, data: E[K]) {
    this.emitter.emit(event, data)
  }

  off<K extends keyof E>(event: K, callback: (data: E[K]) => void) {
    this.emitter.off(event, callback)
  }
}
