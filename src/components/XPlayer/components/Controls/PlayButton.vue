<template>
  <button
    class="swap swap-rotate" :class="[
      styles.btn.root,
      {
        'swap-active': playerCore?.paused,
      },
    ]"
    :disabled="!playerCore?.canplay"
    :title="playTip"
    @click="playerCore?.togglePlay"
  >
    <Icon
      :icon="ICONS.ICON_PASUE" class="swap-off" :class="[
        styles.btn.icon,
      ]"
    />
    <Icon
      :icon="ICONS.ICON_PLAY" class="swap-on" :class="[
        styles.btn.icon,
      ]"
    />
  </button>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { ICONS } from '@/components/XPlayer/index.const'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  btn: {
    ...controlStyles.btn,
    root: [controlStyles.btn.root],
  },
})

const NAME = '播放/暂停'

const { playerCore, shortcuts } = usePlayerContext()

const playTip = computed(() => {
  const tip = shortcuts.getShortcutsTip('togglePlay')
  return `${NAME}${tip}`
})
</script>
