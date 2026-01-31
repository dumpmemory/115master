import type { PlayerContext } from './usePlayerProvide'
import type { VideoSource } from '@/components/XPlayer/types'
import { useDebounceFn } from '@vueuse/core'
import { minBy } from 'lodash'
import { ref, shallowRef, toValue, watch } from 'vue'
import { EVENTS } from '@/components/XPlayer/events'
import { AVPLAYER_ENABLED_EXTENSIONS } from '@/components/XPlayer/index.const'
import { PlayerCoreType } from './playerCore/types'
import { VIDEO_CATCH_ERROES } from './playerCore/useCatchVideo'

/**
 * 视频源
 */
export function useSources(ctx: PlayerContext) {
  /** 日志 */
  const logger = ctx.logger.sub('useSources')
  /** 视频元素 */
  const playerElementRef = ctx.refs.playerElementRef
  /** 播放器 */
  const playerCore = ctx?.playerCore
  /** 视频源列表 */
  const list = ctx.rootProps.sources
  /** 当前视频源 */
  const current = ref<VideoSource | null>(null)
  /** 是否中断 */
  const isInterrupt = shallowRef(false)
  /** 是否正在切换播放器核心 */
  const isSwitching = shallowRef(false)
  /** 获取 hls 视频源 */
  const getHlsSource = () => {
    return list.value.find(item => item.type === 'hls')
  }
  const getDefaultPlayerCore = (source: VideoSource) => {
    if (source.type === 'hls') {
      return PlayerCoreType.Hls
    }
    if (AVPLAYER_ENABLED_EXTENSIONS.includes(source.extension)) {
      return PlayerCoreType.AvPlayer
    }
    return PlayerCoreType.Native
  }

  /** 初始化视频 */
  const initializeVideo = async (
    source: VideoSource,
    playerCoreType?: PlayerCoreType,
    lastTime?: number,
  ) => {
    // 更新当前源
    current.value = source
    const hlsSource = getHlsSource()

    try {
      await ctx.driver?.switchDriver(
        playerCoreType ?? getDefaultPlayerCore(source),
      )

      if (!playerCore.value) {
        throw new Error('player is not found')
      }

      if (!playerElementRef.value) {
        throw new Error('playerElementRef is not found')
      }

      ctx.eventMitt.on(EVENTS.ERROR, ([_, err]) => {
        if (err === VIDEO_CATCH_ERROES.VIDEO_TRACK_LOSS) {
          logger.error('视频轨道丢失')
          if (
            hlsSource
            && playerCore?.value?.type !== PlayerCoreType.Hls
          ) {
            if (confirm('检测到视频轨道丢失，是否切换到 HLS 视频源？\nTips：实验性功能，目前算法可能不准确！')) {
              initializeVideo(hlsSource, undefined, lastTime ?? 0)
            }
          }
          else if (playerCore.value) {
            playerCore.value.loadError = err
          }
        }
        if (err === VIDEO_CATCH_ERROES.VIDEO_FRAMED_DROPPED) {
          logger.error('视频严重丢帧')
          if (
            hlsSource
            && playerCore?.value?.type !== PlayerCoreType.Hls
          ) {
            if (confirm('检测到视频严重丢帧，是否切换到 HLS 视频源？\nTips：实验性功能，目前算法可能不准确！')) {
              initializeVideo(hlsSource, undefined, lastTime ?? 0)
            }
          }
          else if (playerCore.value) {
            playerCore.value.loadError = err
          }
        }
      })

      // 初始化播放器
      await playerCore.value.init(playerElementRef.value)

      // 加载视频源
      await playerCore.value.load(source.url, lastTime ?? 0)
    }
    catch (error) {
      if (error instanceof Error || error instanceof MediaError) {
        if (hlsSource && playerCore?.value?.type !== PlayerCoreType.Hls) {
          logger.warn('当前视频源播放失败，尝试切换到 HLS 视频源', error)
          await initializeVideo(hlsSource, undefined, lastTime ?? 0)
        }
        return
      }
      throw error
    }
  }

  /** 切换视频源 */
  const changeQuality = async (source: VideoSource) => {
    if (!playerCore.value) {
      throw new Error('player is not found')
    }
    /** 记住当前播放时间和播放状态 */
    const currentTime = playerCore.value.currentTime || 0

    // 初始化新视频驱动
    await initializeVideo(source, undefined, currentTime)

    // 更新偏好设置
    if (ctx.rootPropsVm.quality) {
      ctx.rootPropsVm.quality.value = source.quality
    }
  }

  /**
   * 循环切换画质
   * @param direction 方向 1: 下一个画质 -1: 上一个画质
   */
  const cycleQuality = async (direction: 1 | -1) => {
    if (!current.value || list.value.length <= 1) {
      return
    }

    const currentIndex = list.value.findIndex(
      item => item.quality === current.value!.quality,
    )

    if (currentIndex === -1) {
      return
    }

    const newIndex = direction === 1
      ? (currentIndex + 1) % list.value.length /** 下一个画质 */
      : currentIndex === 0 ? list.value.length - 1 : currentIndex - 1 /** 上一个画质 */

    await changeQuality(list.value[newIndex])
  }

  /** 画质提升（循环切换到下一个更高画质） */
  const cycleQualityUp = async () => {
    await cycleQuality(1)
  }

  /** 画质降低（循环切换到上一个更低画质） */
  const cycleQualityDown = async () => {
    await cycleQuality(-1)
  }

  /** 中断源 */
  const interruptSource = () => {
    isInterrupt.value = true
    if (playerCore.value) {
      playerCore.value
        .destroy()
        .catch((e: Error) => logger.error('销毁播放器失败:', e))
    }
  }

  /** 恢复源 */
  const resumeSource = () => {
    isInterrupt.value = false
    initializeVideo(current.value!)
  }

  /** 切换播放器核心的实际实现 */
  const switchPlayerCoreImpl = async (type: PlayerCoreType) => {
    if (isSwitching.value) {
      logger.warn('正在切换播放器核心，忽略此次操作')
      return
    }

    if (!current.value) {
      throw new Error('当前没有视频源')
    }

    isSwitching.value = true

    try {
      const currentTime = playerCore.value?.currentTime || 0
      const wasPaused = playerCore.value?.paused ?? true

      // 确保当前播放器完全停止
      if (playerCore.value && !playerCore.value.paused) {
        await playerCore.value.pause()
      }

      await initializeVideo(current.value, type)

      if (playerCore.value) {
        await playerCore.value.seek(currentTime)

        // 恢复播放状态
        if (!wasPaused) {
          await playerCore.value.play()
        }
      }
    }
    finally {
      isSwitching.value = false
    }
  }

  /** 使用防抖的切换播放器核心方法 */
  const switchPlayerCore = useDebounceFn(switchPlayerCoreImpl, 300)

  /** 获取指定质量的最近视频源 */
  const getRecentSource = (sources: VideoSource[], quality: number) => {
    const recentSourcesOfQuality = minBy(sources, item =>
      Math.abs(item.quality - quality))

    return recentSourcesOfQuality
  }

  /** 获取首选视频源 */
  function getPreferredSource(sources: VideoSource[]) {
    const preferredQuality = toValue(ctx.rootProps.quality)
    let targetSource = list.value[0]

    if (preferredQuality) {
      const recentSourcesOfQuality = getRecentSource(
        sources,
        preferredQuality,
      )
      if (recentSourcesOfQuality) {
        targetSource = recentSourcesOfQuality
      }
    }
    return targetSource
  }

  /** 监听视频源列表变化 */
  async function watchListCallback() {
    isInterrupt.value = false
    if (list.value.length === 0) {
      await ctx.playerCore.value?.destroy()
      return
    }

    const targetSource = getPreferredSource(list.value)

    await initializeVideo(
      targetSource,
      undefined,
      toValue(ctx.rootProps.lastTime),
    )
  }

  watch(
    list,
    watchListCallback,
    { immediate: true, deep: true },
  )

  return {
    list,
    current,
    changeQuality,
    cycleQualityUp,
    cycleQualityDown,
    interruptSource,
    resumeSource,
    isInterrupt,
    isSwitching,
    switchPlayerCore,
  }
}
