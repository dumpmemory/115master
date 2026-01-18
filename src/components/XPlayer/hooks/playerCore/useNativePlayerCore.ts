import type { PlayerCoreMethods } from './types'
import type { PlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { shallowRef } from 'vue'
import { EVENTS } from '@/components/XPlayer/events'
import { PlayerCoreType } from './types'
import { useCatchVideoFramedDropped, useCatchVideoTrackLoss } from './useCatchVideo'
import { usePlayerCoreState } from './usePlayerCoreState'

/**
 * 原生播放器核心
 */
export function useNativePlayerCore(_ctx: PlayerContext) {
  /** 视频元素 */
  const renderElementRef = shallowRef<HTMLVideoElement>()

  /** 状态 */
  const state = usePlayerCoreState()

  /** 事件 mitt */
  const eventMitt = _ctx.eventMitt

  /** 捕获视频轨道丢失异常 */
  useCatchVideoTrackLoss(renderElementRef, (error) => {
    eventMitt.emit(EVENTS.ERROR, [_ctx, error])
  })

  /** 捕获视频丢帧异常 */
  useCatchVideoFramedDropped(renderElementRef, (error) => {
    eventMitt.emit(EVENTS.ERROR, [_ctx, error])
  })

  /** 获取视频元素 */
  const getVideoElementRef = () => {
    if (!renderElementRef.value) {
      throw new Error('videoElementRef is not found')
    }
    return renderElementRef.value
  }

  let listeners: {
    event: keyof HTMLMediaElementEventMap
    handler: (event: Event) => void
    options?: AddEventListenerOptions
  }[] = []

  function on(
    event: keyof HTMLMediaElementEventMap,
    handler: (event: Event) => void,
    options?: AddEventListenerOptions,
  ) {
    if (renderElementRef.value) {
      renderElementRef.value.addEventListener(event, handler, options)
      listeners.push({ event, handler, options })
    }
  }

  function off(
    event: keyof HTMLMediaElementEventMap,
    handler: (event: Event) => void,
    options?: AddEventListenerOptions,
  ) {
    if (renderElementRef.value) {
      renderElementRef.value.removeEventListener(event, handler, options)
      listeners = listeners.filter(listener =>
        listener.event !== event
        || listener.handler !== handler
        || listener.options !== options,
      )
    }
  }

  function offListeners() {
    for (const listener of listeners) {
      off(listener.event as keyof HTMLMediaElementEventMap, listener.handler, listener.options)
    }
  }

  const eventHanldes: Record<string, (event: Event) => void> = {
    play: () => {
      state.paused.value = false
      eventMitt.emit(EVENTS.PLAY, _ctx)
    },
    pause: () => {
      state.paused.value = true
      eventMitt.emit(EVENTS.PAUSED, _ctx)
    },
    playing: () => {
      state.paused.value = false
      eventMitt.emit(EVENTS.PLAYING, _ctx)
    },
    ended: () => {
      state.paused.value = true
      eventMitt.emit(EVENTS.ENDED, _ctx)
    },
    waiting: () => {
      state.isLoading.value = true
      eventMitt.emit(EVENTS.WAITING, _ctx)
    },
    canplay: () => {
      state.isLoading.value = false
      state.canplay.value = true
      eventMitt.emit(EVENTS.CANPLAY, _ctx)
    },
    seeking: () => {
      state.isLoading.value = true
      eventMitt.emit(EVENTS.SEEKING, _ctx)
    },
    seeked: () => {
      state.isLoading.value = false
      eventMitt.emit(EVENTS.SEEKED, _ctx)
    },
    timeupdate: () => {
      state.currentTime.value = renderElementRef.value?.currentTime ?? 0
      eventMitt.emit(EVENTS.TIMEUPDATE, _ctx)
    },
    error: (_event: Event) => {
      const error = getError(_event)
      if (error) {
        state.loadError.value = error
        eventMitt.emit(EVENTS.ERROR, [_ctx, error])
      }
    },
  }

  function onInitEvents() {
    for (const [event, handler] of Object.entries(eventHanldes)) {
      on(event as keyof HTMLMediaElementEventMap, handler)
    }
  }

  function loadWithPromise(videoElement: HTMLVideoElement, play: () => Promise<void>, lastTime?: number) {
    return new Promise<void>((resolve, reject) => {
      on('loadedmetadata', () => {
        state.duration.value = videoElement.duration
        state.videoWidth.value = videoElement.videoWidth
        state.videoHeight.value = videoElement.videoHeight

        // 初始化播放时间
        if (lastTime !== undefined || state.currentTime.value > 0) {
          videoElement.currentTime = lastTime ?? state.currentTime.value
        }

        resolve()
        if (state.autoPlay.value) {
          play()
        }
      }, {
        once: true,
      })
      on('error', (_event) => {
        const error = getError(_event)
        if (error) {
          state.loadError.value = error
          eventMitt.emit(EVENTS.ERROR, [_ctx, error])
          reject(error)
        }
      }, {
        once: true,
      })
    })
  }

  function getError(_event: Event): Error | MediaError | unknown {
    const error
      = (_event.target as HTMLVideoElement)?.error
        ?? new Error('Video element unknown error')
    // if (error instanceof MediaError && error.code === MediaError.MEDIA_ERR_ABORTED)
    //   return
    // if (error instanceof DOMException && error.name === 'AbortError') {
    //   return
    // }
    return error
  }

  const methods: PlayerCoreMethods = {
    init: async (container) => {
      const videoElement = document.createElement('video')
      container.appendChild(videoElement)
      videoElement.style.width = '100%'
      videoElement.style.height = '100%'
      videoElement.style.objectFit = 'contain'
      renderElementRef.value = videoElement
      onInitEvents()
      return Promise.resolve()
    },
    load: async (url, lastTime) => {
      const videoElement = getVideoElementRef()

      // 初始化音量
      methods.setVolume(state.volume.value)
      // 初始化静音
      methods.setMute(state.muted.value)
      // 初始化自动播放
      methods.setAutoPlay(state.autoPlay.value)
      // 初始化视频源
      videoElement.src = url
      // 初始化倍速（必须在src赋值后设置）
      methods.setPlaybackRate(state.playbackRate.value)
      return loadWithPromise(videoElement, methods.play, lastTime)
    },
    getRenderElement: () => {
      return getVideoElementRef()
    },
    play: () => {
      const videoElement = getVideoElementRef()
      return videoElement
        .play()
        .then(() => {
          state.paused.value = false
        })
        .catch((error) => {
          /**
           * 浏览器在未设置静音且未交互时，会抛出 NotAllowedError，不允许直接播放
           * 那么我们设置 video 为静音，并且标记音频被挂起，然后重新播放
           * @more NotAllowedError: play() failed because the user didn't interact with the document first. https://goo.gl/xX8pDD
           */
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            state.isSuspended.value = true
            const videoElement = getVideoElementRef()
            videoElement.muted = true
            return methods.play()
          }
          _ctx.logger.error('播放失败:', error)
          throw error
        })
    },
    pause: () => {
      const videoElement = getVideoElementRef()
      state.paused.value = true
      videoElement.pause()
      return Promise.resolve()
    },
    togglePlay: () => {
      if (state.paused.value) {
        return methods.play()
      }
      return methods.pause()
    },
    setPlaybackRate: (rate) => {
      const videoElement = getVideoElementRef()
      state.playbackRate.value = rate
      videoElement.playbackRate = rate
    },
    setVolume: (volume) => {
      const videoElement = getVideoElementRef()
      state.volume.value = volume
      videoElement.volume = volume / 100
    },
    setMute: (muted) => {
      const videoElement = getVideoElementRef()
      state.muted.value = muted
      videoElement.muted = muted
    },
    toggleMute: () => {
      methods.setMute(!state.muted.value)
      if (state.isSuspended.value) {
        state.isSuspended.value = false
      }
    },
    resumeSuspended: async () => {
      const videoElement = getVideoElementRef()
      videoElement.muted = false
      state.isSuspended.value = false
    },
    setAutoPlay: (autoPlay) => {
      const videoElement = getVideoElementRef()
      state.autoPlay.value = autoPlay
      videoElement.autoplay = autoPlay
    },
    seek: async (time) => {
      return new Promise<void>((resolve) => {
        const videoElement = getVideoElementRef()
        videoElement.currentTime = time
        state.currentTime.value = time
        if (videoElement.src) {
          on('seeked', () => {
            resolve()
          }, {
            once: true,
          })
        }
        else {
          resolve()
        }
      })
    },
    destroy: () => {
      const videoElement = renderElementRef.value
      if (!videoElement)
        return Promise.resolve()

      offListeners()

      // 停止播放并清理
      videoElement.pause()
      videoElement.currentTime = 0
      videoElement.src = ''
      videoElement.load() // 清空缓冲区
      videoElement.remove()

      // 重置状态
      state.reset()
      renderElementRef.value = undefined

      return Promise.resolve()
    },
  }

  return {
    ...state,
    ...methods,
    on,
    off,
    offListeners,
    loadWithPromise,
    renderElementRef,
    type: PlayerCoreType.Native as const,
  }
}
