import type { PlayerContext } from './usePlayerProvide'
import { computed, shallowRef } from 'vue'

/** 倍速 */
export function usePlaybackRate(ctx: PlayerContext) {
  /** 正常倍速 */
  const NORMAL_RATE = 1
  /** 最小倍速 */
  const MIN_RATE = 0.3
  /** 最大倍速 */
  const MAX_RATE = 15

  /** 长按倍速 (从偏好设置读取) */
  const longPressRate = computed(() => {
    const rate = ctx.rootPropsVm.longPressPlaybackRate.value
    return rate
  })
  /** 预设的倍速选项 */
  const rateOptions = shallowRef([
    MIN_RATE,
    0.5,
    0.7,
    NORMAL_RATE,
    1.3,
    1.5,
    1.7,
    2,
    3,
    5,
    10,
    MAX_RATE,
  ])
  /** 倍速 */
  const current = ctx.rootPropsVm.playbackRate
  /** 当前倍速的索引 */
  const currentRateIndex = computed(
    () => rateOptions.value.findIndex(r => r === current.value) ?? -1,
  )
  /** 是否启用长按快速前进 */
  const fastForward = shallowRef(false)

  /** 设置倍速 */
  const set = (rate: number) => {
    ctx.playerCore.value?.setPlaybackRate(rate)
  }

  /** 调整倍速 */
  const setByIndex = (index: number) => {
    if (index < 0 || index >= rateOptions.value.length)
      return
    const newRate = rateOptions.value[index]
    set(newRate)
  }

  /** 增加倍速 */
  const up = () => {
    setByIndex(currentRateIndex.value + 1)
  }

  /** 减少倍速 */
  const down = () => {
    setByIndex(currentRateIndex.value - 1)
  }

  /** 减少倍速并限制下限 */
  const downWithLowerLimit = () => {
    if (current.value <= NORMAL_RATE)
      return
    setByIndex(currentRateIndex.value - 1)
  }

  /** 长按快速前进 */
  const holdPlaybackRate = shallowRef(1)
  const startLongPressFastForward = () => {
    if (!ctx.playerCore.value || fastForward.value)
      return
    fastForward.value = true
    set(longPressRate.value)
    holdPlaybackRate.value = current.value
    if (ctx.playerCore.value.paused) {
      ctx.playerCore.value.play()
    }
  }

  /** 停止长按快速前进 */
  const stopLongPressFastForward = () => {
    if (!ctx.playerCore.value)
      return
    fastForward.value = false
    set(holdPlaybackRate.value)
  }

  return {
    MIN_RATE,
    MAX_RATE,
    NORMAL_RATE,
    current,
    rateOptions,
    fastForward,
    set,
    up,
    down,
    downWithLowerLimit,
    longPressRate,
    startLongPressFastForward,
    stopLongPressFastForward,
  }
}
