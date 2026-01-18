<template>
  <button
    class="btn btn-ghost btn-circle"
    :class="{ 'swap-active': !fullscreen.isFullscreen.value }"
    :title="fullscreenTip"
    @click="fullscreen.toggleFullscreen"
  >
    <Icon class="size-7" :icon="icon" />
  </button>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { ICONS } from '@/components/XPlayer/index.const'

const { fullscreen, shortcuts } = usePlayerContext()

const icon = computed(() => {
  return fullscreen.isFullscreen.value
    ? ICONS.ICON_FULLSCREEN_EXIT
    : ICONS.ICON_FULLSCREEN
})

const NAME = '全屏'

const fullscreenTip = computed(() => {
  const tip = shortcuts.getShortcutsTip('toggleFullscreen')
  return `${NAME}${tip}`
})
</script>
