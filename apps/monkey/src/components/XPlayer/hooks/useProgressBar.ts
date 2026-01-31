import type { PlayerContext } from './usePlayerProvide'
import { useElementSize, useThrottleFn } from '@vueuse/core'
import { computed, onUnmounted, shallowRef, watch } from 'vue'

/**
 * 进度条
 */
export function useProgressBar(ctx: PlayerContext) {
  /** 节流时间 */
  const THROTTLE_TIME = 1000 / 60
  /** 长按阈值 */
  const LONG_PRESS_THRESHOLD = 300
  /** 是否拖拽中 */
  const isDragging = shallowRef(false)
  /** 是否长按拖拽中 */
  const isLongPressDragging = shallowRef(false)
  /** 是否在进度条内 */
  const isInProgressBar = shallowRef(false)
  /** 拖拽进度 */
  const dragProgress = shallowRef(0)
  /** 原始进度 */
  const originalProgress = shallowRef(0)
  /** 预览时间 */
  const previewTime = shallowRef(0)
  /** 预览进度 */
  const previewProgress = shallowRef(0)
  /** 预览是否可见 */
  const isPreviewVisible = shallowRef(false)
  /** 进度条容器 */
  const progressBarWrapperRef = shallowRef<HTMLElement | null>(null)
  /** 缩略图组件引用 */
  const thumbnailRef = shallowRef<{ getCurrentFrameTime?: () => number | null } | null>(null)
  /** 长按计时器 */
  let longPressTimer: ReturnType<typeof setTimeout> | null = null
  /** 进度条宽度 - 使用 useElementSize */
  const { width: progressBarWidth } = useElementSize(progressBarWrapperRef)
  /** 是否悬停 */
  const isHovering = computed(() => isInProgressBar.value || isDragging.value)
  /** 当前播放进度 */
  const progressValue = computed(() => {
    return (
      ((ctx.playerCore.value?.currentTime ?? 0) / (ctx.playerCore.value?.duration ?? 1)) * 100
    )
  })
  /** 视频时长 */
  const duration = computed(() => ctx.playerCore.value?.duration ?? 0)
  /** 节流鼠标移动 */
  const handleBarWrapperMouseMoveWithThrottle = useThrottleFn(handleBarWrapperMouseMove, THROTTLE_TIME)

  // 监听拖拽状态变化
  watch(isDragging, (newValue, oldValue) => {
    if (newValue && !oldValue) {
      // 开始拖拽时启动长按计时器
      longPressTimer = setTimeout(() => {
        isLongPressDragging.value = true
      }, LONG_PRESS_THRESHOLD)
    }
    else if (!newValue && oldValue) {
      // 结束拖拽时清除计时器和长按状态
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
      isLongPressDragging.value = false
    }
  })

  /** 等待拖拽结束 */
  function waitDragEnd(): Promise<boolean> {
    return new Promise((resolve) => {
      const unwatch = watch(isDragging, (value) => {
        if (!value) {
          resolve(true)
          unwatch()
        }
      })
    })
  }

  /** 计算鼠标位置对应的进度 */
  function calculatePosition(event: MouseEvent, element: HTMLElement) {
    const rect = element.getBoundingClientRect()
    const position = (event.clientX - rect.left) / rect.width
    return Math.min(Math.max(position, 0), 1)
  }

  /** 更新预览位置 */
  function updatePreview(position: number) {
    previewProgress.value = position * 100
    previewTime.value = position * duration.value
  }

  /** 开始拖拽 */
  function startDragging(position: number) {
    ctx.controls.setDragging(true)
    ctx.controls.setDisabledHideOnMouseLeave(true)
    isDragging.value = true
    originalProgress.value = progressValue.value
    dragProgress.value = position * 100
    previewTime.value = position * duration.value
    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
  }

  /** 更新拖拽 */
  function updateDragging(position: number) {
    if (!isDragging.value)
      return
    dragProgress.value = position * 100
    previewTime.value = position * duration.value
  }

  /** 停止拖拽 */
  function stopDragging(position: number) {
    if (isDragging.value) {
      /** 优先使用缩略图的时间（如果存在且可见） */
      const thumbnailFrameTime = thumbnailRef.value?.getCurrentFrameTime?.()
      const finalTime = thumbnailFrameTime ?? (position * duration.value)
      ctx.playerCore.value?.seek(finalTime)
      previewProgress.value = position * 100
      previewTime.value = finalTime
    }
    isDragging.value = false
    ctx.controls.setDragging(false)
    ctx.controls.setDisabledHideOnMouseLeave(false)
  }

  /** 显示预览 */
  function showPreview() {
    isPreviewVisible.value = true
  }

  /** 隐藏预览 */
  function hidePreview() {
    if (!isDragging.value) {
      isPreviewVisible.value = false
      // 重置预览进度和时间
      previewProgress.value = 0
      previewTime.value = 0
    }
  }

  /** BarWrapper 鼠标按下 */
  function handleBarWrapperMouseDown(event: MouseEvent) {
    if (!progressBarWrapperRef.value)
      return
    const position = calculatePosition(event, progressBarWrapperRef.value)
    startDragging(position)
  }

  /** BarWrapper 鼠标进入 */
  function handleBarWrapperMouseEnter() {
    isInProgressBar.value = true
    if (!isPreviewVisible.value) {
      showPreview()
    }
  }

  /** BarWrapper 鼠标移动 */
  function handleBarWrapperMouseMove(event: MouseEvent) {
    if (!progressBarWrapperRef.value)
      return
    const position = calculatePosition(event, progressBarWrapperRef.value)
    updatePreview(position)
  }

  /** BarWrapper 鼠标离开 */
  function handleBarWrapperMouseLeave() {
    isInProgressBar.value = false
    hidePreview()
  }

  /** 全局鼠标移动 */
  function handleGlobalMouseMove(event: MouseEvent) {
    if (!progressBarWrapperRef.value)
      return
    const position = calculatePosition(event, progressBarWrapperRef.value)
    updateDragging(position)
  }

  /** 全局鼠标松开 */
  function handleGlobalMouseUp(event: MouseEvent) {
    document.removeEventListener('mousemove', handleGlobalMouseMove)
    document.removeEventListener('mouseup', handleGlobalMouseUp)
    if (!progressBarWrapperRef.value)
      return
    const position = calculatePosition(event, progressBarWrapperRef.value)
    stopDragging(position)
    if (!isInProgressBar.value) {
      hidePreview()
    }
  }

  /** 设置缩略图组件引用 */
  function setThumbnailRef(ref: { getCurrentFrameTime?: () => number | null } | null) {
    thumbnailRef.value = ref
  }

  onUnmounted(() => {
    document.removeEventListener('mousemove', handleGlobalMouseMove)
    document.removeEventListener('mouseup', handleGlobalMouseUp)
  })

  return {
    // 状态
    isDragging,
    isLongPressDragging,
    isInProgressBar,
    isHovering,
    dragProgress,
    originalProgress,
    previewTime,
    previewProgress,
    isPreviewVisible,
    progressBarWrapperRef,
    progressBarWidth,
    progressValue,
    duration,

    // 方法
    waitDragEnd,
    handleBarWrapperMouseDown,
    handleBarWrapperMouseEnter,
    handleBarWrapperMouseMove,
    handleBarWrapperMouseLeave,
    handleBarWrapperMouseMoveWithThrottle,
    setThumbnailRef,
  }
}
