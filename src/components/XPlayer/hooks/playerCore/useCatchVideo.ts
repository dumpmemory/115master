import type { Ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { defer } from 'lodash'
import { toValue } from 'vue'
import { xPlayerLogger } from '@/components/XPlayer/utils/logger'

export const VIDEO_CATCH_ERROES = {
  VIDEO_TRACK_LOSS: new Error('Video track loss error'),
  VIDEO_FRAMED_DROPPED: new Error('Video framed dropped error'),
}

/**
 * 捕获视频轨道丢失异常
 * @description
 * 视频轨道丢失异常通常表现为视频画面消失，视频进度条活动，但无法看到画面。
 * 这是一种不符合预期的情况，浏览器也无法正确抛出错误。
 *
 * 我们可以在 playing 事件后，通过检查视频的 playbackQuality 来判断是否发生轨道丢失异常。
 * 如果 totalVideoFrames 为 0，则表示发生轨道丢失异常。
 *
 * 为了检查的准确性，加入了 defer 防抖，避免在 playing 事件后立即检查，导致检查不准确。
 * 加入 defer 是否更准确没有经过验证，只是保险起见加入。
 * @param videoElement 视频元素
 * @param onError 错误回调
 */
export function useCatchVideoTrackLoss(
  videoElement: Ref<HTMLVideoElement | undefined>,
  onError: (error: Error) => void,
) {
  function catchException() {
    const el = toValue(videoElement)
    if (!el)
      return

    defer(() => {
      const quality = el.getVideoPlaybackQuality()
      if (quality.totalVideoFrames <= 0) {
        onError(VIDEO_CATCH_ERROES.VIDEO_TRACK_LOSS)
      }
    })
  }

  return useEventListener(videoElement, 'playing', catchException, {
    once: true,
  })
}

/**
 * 捕获视频部分帧解码失败（旧版）
 * @deprecated 请使用 useCatchVideoFramedDropped 替代
 * @param videoElement 视频元素
 * @param onError 错误回调
 */
export function useCatchVideoFramedDroppedOld(
  videoElement: Ref<HTMLVideoElement | undefined>,
  onError: (error: Error) => void,
) {
  /** 日志 */
  const logger = xPlayerLogger.sub('useCatchVideoFramedDroppedOld')
  /** 周期丢帧率阈值 */
  // const CYCLE_ERR_DROPPED_RATE_THRESHOLD = 0.15
  /** 平均丢帧率阈值 */
  const AVG_ERR_DROPPED_RATE_THRESHOLD = 0.15
  /** 丢帧比例阈值 */
  const ERR_DROPPED_RATIO_THRESHOLD = 0.1
  /** 丢帧次数阈值 */
  // const ERR_DROPPED_COUNT_THRESHOLD = 10
  /** 检查间隔 */
  const CHECK_INTERVAL = 30
  /** /** 丢帧次数 */
  let droppedCount = 0
  /** 上次丢帧数 */
  let lastDroppedVFS = 0
  /** 上次总帧数 */
  let lastTotalVFS = 0
  /** 上次检查时间 */
  let lastCheckTime = 0
  /** 累积丢帧率总和（用于计算算术平均数） */
  let sumErrDroppedRate = 0
  /** 周期计数（用于计算算术平均数） */
  let cycleCount = 0
  /** 请求 ID */
  let requestId: number | null = null

  function frameCallback(now: number) {
    const el = toValue(videoElement)
    if (!el)
      return

    if (now - lastCheckTime < CHECK_INTERVAL) {
      checkDroppedFrames()
      return
    }

    lastCheckTime = now
    const r = el.playbackRate

    const quality = el.getVideoPlaybackQuality()
    const { totalVideoFrames: totalVFS, droppedVideoFrames: droppedVFS } = quality
    const cycleTotalVFS = totalVFS - lastTotalVFS
    const cycleDroppedVFS = droppedVFS - lastDroppedVFS
    const cycleErrDroppedVFS = cycleDroppedVFS - cycleTotalVFS * (1 - 1 / r)
    const cycleErrDroppedRate = (cycleErrDroppedVFS > 0)
      ? (cycleErrDroppedVFS / cycleTotalVFS)
      : 0

    sumErrDroppedRate += cycleErrDroppedRate
    cycleCount++
    const avgErrDroppedRate = sumErrDroppedRate / cycleCount
    const errDroppedRatio = droppedCount / cycleCount

    logger.debug(`
      cycleErrDroppedRate: ${cycleErrDroppedRate.toFixed(3)},
      avgErrDroppedRate: ${avgErrDroppedRate.toFixed(3)},
      droppedCount: ${droppedCount},
      cycleCount: ${cycleCount},
      errDroppedRatio: ${errDroppedRatio.toFixed(3)},
      playbackRate: ${r},
    `)

    if (avgErrDroppedRate >= AVG_ERR_DROPPED_RATE_THRESHOLD) {
      droppedCount++
      if (errDroppedRatio >= ERR_DROPPED_RATIO_THRESHOLD) {
        onError(VIDEO_CATCH_ERROES.VIDEO_FRAMED_DROPPED)
        return
      }
    }

    lastDroppedVFS = droppedVFS
    lastTotalVFS = totalVFS
    checkDroppedFrames()
  }

  function checkDroppedFrames() {
    const el = toValue(videoElement)
    if (!el)
      return

    requestId = el.requestVideoFrameCallback(frameCallback)
  }

  function handlePlaying() {
    // droppedCount = 0
    lastDroppedVFS = 0
    lastTotalVFS = 0
    lastCheckTime = 0
    sumErrDroppedRate = 0
    cycleCount = 0
    const el = toValue(videoElement)
    if (requestId) {
      el?.cancelVideoFrameCallback(requestId)
      requestId = null
    }
    checkDroppedFrames()
  }

  return useEventListener(videoElement, 'playing', handlePlaying, {
    once: true,
  })
}

/**
 * 捕获视频部分帧解码失败
 * @description
 * 如果是视频部分帧解码失败，会呈现出一种丢帧跳动的现象。
 * 此时在浏览器 Devtools 的 Media 面板中，查看当前视频的 messages 会出现大量的解码失败信息。
 * 如："Decoded frame with timestamp xxxx.xxx s is out of order."
 *
 * 我们可以通过检查 metadata.processingDuration 来判断帧解码是否失败。
 * metadata.processingDuration 是从提交与此帧具有相同显示时间戳 (PTS)
 * （例如，与 mediaTime 相同）的编码数据包到解码器，直到解码帧准备好显示为止，所经过的时间（以秒为单位）。
 *
 * 如果 metadata.processingDuration 为 undefined，则表示帧解码失败。
 * @see https://web.dev/articles/requestvideoframecallback-rvfc?hl=zh-cn#using_the_requestvideoframecallback_method
 * @param videoElement 视频元素
 * @param onError 错误回调
 */
export function useCatchVideoFramedDropped(
  videoElement: Ref<HTMLVideoElement | undefined>,
  onError: (error: Error) => void,
) {
  /** 日志 */
  const logger = xPlayerLogger.sub('useCatchVideoFramedDropped')
  /** 错误次数阈值 */
  const ERR_COUNT_THRESHOLD = 2
  /** 错误次数 */
  let errCount = 0
  /** 请求 ID */
  let requestId: number | null = null

  function frameCallback(_now: number, metadata: VideoFrameCallbackMetadata) {
    const el = toValue(videoElement)
    if (!el)
      return

    if (metadata.processingDuration === undefined) {
      errCount++
      logger.warn(`当前帧解码错误，错误次数：${errCount}`, metadata)
      if (errCount >= ERR_COUNT_THRESHOLD) {
        onError(VIDEO_CATCH_ERROES.VIDEO_FRAMED_DROPPED)
        errCount = 0
        return
      }
    }

    checkDroppedFrames()
  }

  function checkDroppedFrames() {
    const el = toValue(videoElement)
    if (!el)
      return

    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
      requestId = el.requestVideoFrameCallback(frameCallback)
    }
    else {
      logger.warn('不支持 requestVideoFrameCallback，请使用支持该功能的浏览器')
    }
  }

  function handlePlaying() {
    const el = toValue(videoElement)
    if (requestId) {
      el?.cancelVideoFrameCallback(requestId)
      requestId = null
    }
    errCount = 0
    checkDroppedFrames()
  }

  return useEventListener(videoElement, 'playing', handlePlaying, {
    once: true,
  })
}
