<template>
  <div :class="styles.container">
    <Icon :icon="iconName" :class="styles.icon" />
    <p :class="styles.text">
      <slot>{{ formatErrorMessage(message) }}</slot>
    </p>
    <button v-if="showDetailButton && (props.message instanceof Error)" :class="styles.detailButton" @click="handleShowDetail">
      查看错误
    </button>
    <button
      v-if="props.retryable"
      :class="styles.retryButton"
      @click="$emit('retry')"
    >
      {{ props.retryText }}
    </button>
    <button
      v-if="props.closable"
      :class="styles.closeButton"
      @click="$emit('close')"
    >
      {{ props.closeText }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import { MEDIA_ERROR_NAME } from '@/components/XPlayer/index.const'
import { ICON_ERROR } from '@/icons'
import { clsx } from '@/utils/clsx'

const props = withDefaults(
  defineProps<{
    /** 类型 */
    type?: 'error' | 'warning' | 'info' | 'success'
    /** 是否可重试 */
    retryable?: boolean
    /** 是否可关闭 */
    closable?: boolean
    /** 错误信息 */
    message?: string | Error | MediaError | unknown
    /** 重试按钮文本 */
    retryText?: string
    /** 关闭按钮文本 */
    closeText?: string
    /** 是否无内边距 */
    noPadding?: boolean
    /** 大小 */
    size?: 'mini' | 'small' | 'medium' | 'large'
    /** 图标名称 */
    icon?: string
    /** 是否显示详情 */
    showDetailButton?: boolean
  }>(),
  {
    type: 'error',
    retryable: false,
    message: undefined,
    retryText: '重试',
    noPadding: false,
    size: 'medium',
    icon: ICON_ERROR,
    showDetailButton: true,
  },
)

defineEmits<(e: 'retry' | 'close') => void>()

const iconName = computed(() => props.icon)

/** 格式化错误信息 */
function formatErrorMessage(message: string | Error | MediaError | unknown): string {
  if (message instanceof Error) {
    return `${message.name}: ${message.message}`
  }
  if (message instanceof MediaError) {
    if (message.code in MEDIA_ERROR_NAME) {
      return `${MEDIA_ERROR_NAME[message.code as keyof typeof MEDIA_ERROR_NAME]}`
    }
  }
  return message as string
}

/** 样式常量定义 */
const styles = computed(() => clsx({
  // 容器样式
  container: [
    'text-base-content/70 flex flex-col items-center justify-center',
    // 间距和内边距
    props.size === 'mini' ? 'gap-1' : 'gap-2',
    !props.noPadding && props.size !== 'mini' && 'p-2',
    // 动画效果
    'animate-in fade-in duration-300',
  ],
  // 图标样式
  icon: [
    `text-${props.type}`,
    // 根据尺寸调整图标大小
    {
      mini: 'text-2xl',
      small: 'text-3xl',
      medium: 'text-5xl',
      large: 'text-6xl',
    }[props.size],
  ],
  // 文本样式
  text: [
    'm-0 text-center font-medium select-text',
    // 根据尺寸调整字体大小
    {
      mini: 'text-xs',
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
    }[props.size],
  ],
  // 详情按钮样式
  detailButton: ['btn btn-error btn-xs'],
  // 重试按钮样式
  retryButton: [
    'btn btn-error btn-sm transition-all duration-200',
    'hover:btn-error hover:scale-105 active:scale-95',
  ],
  // 关闭按钮样式
  closeButton: [
    'btn btn-neutral btn-xs',
  ],
}))

/** 处理错误详情 */
function handleDetail(detail: string | Error | unknown): string {
  if (detail instanceof Error) {
    return `[Error name]: ${detail.name}\n[Error message]: ${detail.message}\n[Error stack]: ${detail.stack}`
  }
  return detail as string
}

/** 显示详情 */
function handleShowDetail() {
  const detail = handleDetail(props.message)
  const { copy } = useClipboard()
  copy(detail)
  alert(detail)
  alert('已将错误信息复制到剪贴板')
}
</script>
