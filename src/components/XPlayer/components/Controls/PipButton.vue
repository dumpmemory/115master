<template>
  <button
    class="swap swap-rotate" :class="[styles.btn.root, { 'swap-active': !pictureInPicture.isPip.value }]"
    :title="pipTip" :disabled="playerCore?.type === PlayerCoreType.AvPlayer" @click="pictureInPicture.toggle"
  >
    <Icon :icon="ICONS.ICON_PIP_EXIT" class="swap-off" :class="[styles.btn.icon]" />
    <Icon :icon="ICONS.ICON_PIP" class="swap-on" :class="[styles.btn.icon]" />
  </button>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { PlayerCoreType } from '@/components/XPlayer/hooks/playerCore/types'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { ICONS } from '@/components/XPlayer/index.const'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  ...controlStyles,
})

const { pictureInPicture, playerCore, shortcuts } = usePlayerContext()

const NAME = '画中画'

const pipTip = computed(() => {
  const tip = shortcuts.getShortcutsTip('togglePictureInPicture')
  return `${NAME}${tip}`
})
</script>
