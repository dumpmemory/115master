<template>
  <div
    ref="controlGroupRef"
    :class="[styles.root]"
    :style="{ width: expanded ? `${expandedWidth}px` : undefined }"
    :data-expanded="expanded"
    :data-direction="direction"
  >
    <!-- 左向展开：默认按钮在前，展开内容在后 -->
    <template v-if="direction === 'left'">
      <div ref="defaultContentRef" :class="[styles.defaultContent]">
        <slot name="default" />
      </div>
      <div
        ref="expandedContentRef"
        :class="[styles.expandedContent]"
        :style="{ width: expanded ? `${measuredWidth}px` : undefined }"
      >
        <slot name="expanded" />
      </div>
    </template>

    <!-- 右向展开：展开内容在前，默认按钮在后 -->
    <template v-else>
      <div
        ref="expandedContentRef"
        :class="[styles.expandedContent]"
        :style="{ width: expanded ? `${measuredWidth}px` : undefined }"
      >
        <slot name="expanded" />
      </div>
      <div ref="defaultContentRef" :class="[styles.defaultContent]">
        <slot name="default" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * ControlButtonGroup 控制按钮组组件
 *
 * 功能说明：
 * - 鼠标悬停时展开显示额外的控制按钮
 * - 平滑的展开/折叠动画效果
 * - 支持弹窗状态感知，弹窗打开时不自动折叠
 * - 自动计算子元素宽度以适应不同数量的按钮
 * - 支持双向展开（左向/右向）
 *
 * 插槽：
 * - default: 默认显示的按钮（始终可见）
 * - expanded: 展开时显示的按钮（悬停时可见）
 *
 * Props:
 * - direction: 展开方向，'left' 从左向右展开，'right' 从右向左展开（默认）
 */
import { useElementHover, useTimeoutFn } from '@vueuse/core'
import { computed, nextTick, onMounted, shallowRef, watch } from 'vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { clsx } from '@/utils/clsx'

interface Props {
  direction?: 'left' | 'right'
}

const { direction = 'right' } = defineProps<Props>()

/**
 * 控制按钮组默认宽度降级值（当无法测量时使用）
 */
const DEFAULT_BUTTON_WIDTH_FALLBACK = 40

/**
 * 延迟展开/折叠的时间（防抖）
 */
const DELAY_MS = 60

const styles = computed(() => clsx({
  root: [
    'flex items-center',
    direction === 'left' ? 'justify-start' : 'justify-end',
    'w-10',
    'group/control',
    'transition-[width] duration-300 ease-[var(--app-ease-in-out-expo)]',
  ],
  expandedContent: [
    'flex items-center gap-1',
    'overflow-hidden',
    'opacity-0',
    'w-0',
    'transition-[opacity,width,margin] duration-300 ease-[var(--app-ease-in-out-expo)]',
    'group-data-[expanded="true"]/control:opacity-100',
  ],
  defaultContent: [
    'flex-shrink-0',
  ],
}))

const { popupManager } = usePlayerContext()
const controlGroupRef = shallowRef<HTMLElement>()
const defaultContentRef = shallowRef<HTMLElement>()
const expandedContentRef = shallowRef<HTMLElement>()
const expanded = shallowRef(false)
const isHovered = useElementHover(controlGroupRef)
const measuredWidth = shallowRef(0)
const hasOpenPopup = computed(() => popupManager?.hasOpenPopup.value ?? false)

const expandedWidth = computed(() => {
  const defaultButtonWidth = getDefaultButtonWidth()
  const element = expandedContentRef.value || controlGroupRef.value
  const gap = element ? getGapValue(element) : 0
  return Math.ceil(defaultButtonWidth + measuredWidth.value + gap)
})

const expandTimer = useTimeoutFn(async () => {
  // 展开前重新测量宽度，确保能获取正确的子元素宽度
  await updateMeasuredWidth()
  expanded.value = true
}, DELAY_MS)

const foldTimer = useTimeoutFn(() => {
  if (!hasOpenPopup.value) {
    expanded.value = false
  }
}, DELAY_MS)

onMounted(() => {
  updateMeasuredWidth()
})

watch(() => isHovered.value, (value) => {
  if (value) {
    foldTimer.stop()
    expandTimer.start()
  }
  else {
    expandTimer.stop()
    foldTimer.start()
  }
})

watch(hasOpenPopup, (isOpen, wasOpen) => {
  if (isOpen) {
    foldTimer.stop()
  }
  else if (wasOpen && !isHovered.value) {
    foldTimer.start()
  }
})

/**
 * 获取元素的 gap 值
 * @param element - 要测量的元素
 * @returns gap 的像素值，normal 返回 0
 */
function getGapValue(element: HTMLElement): number {
  const computedStyles = window.getComputedStyle(element)
  const gap = computedStyles.gap
  if (gap === 'normal') {
    return 0
  }
  return parseFloat(gap)
}

/**
 * 计算展开内容区域的总宽度
 * 通过临时设置 width 为 auto 来测量所有子元素的实际宽度
 * @returns 所有子元素宽度之和加上间隙宽度
 */
function calculateChildrenWidth() {
  if (!expandedContentRef.value) {
    return 0
  }

  const children = Array.from(expandedContentRef.value.children) as HTMLElement[]
  if (children.length === 0) {
    return 0
  }

  const originalWidth = expandedContentRef.value.style.width
  const originalPosition = expandedContentRef.value.style.position

  // 临时设置为绝对定位和 auto 宽度，避免父容器宽度限制
  expandedContentRef.value.style.position = 'absolute'
  expandedContentRef.value.style.width = 'auto'

  const totalWidth = children.reduce((sum, child) => sum + child.offsetWidth, 0)

  expandedContentRef.value.style.width = originalWidth
  expandedContentRef.value.style.position = originalPosition

  const gap = getGapValue(expandedContentRef.value)
  const gapTotal = gap * (children.length - 1)

  return totalWidth + gapTotal
}

/**
 * 获取默认内容区域按钮的宽度
 * @returns 第一个子元素的宽度，无法测量时返回降级值
 */
function getDefaultButtonWidth(): number {
  if (!defaultContentRef.value) {
    return DEFAULT_BUTTON_WIDTH_FALLBACK
  }

  const children = Array.from(defaultContentRef.value.children)
  if (children.length === 0) {
    return DEFAULT_BUTTON_WIDTH_FALLBACK
  }

  const firstChild = children[0] as HTMLElement
  return firstChild.offsetWidth
}

/**
 * 更新测量宽度的异步函数
 * 等待 DOM 更新后重新计算子元素宽度
 */
async function updateMeasuredWidth() {
  await nextTick()
  measuredWidth.value = calculateChildrenWidth()
}
</script>
