<template>
  <div
    :class="styles.root"
    :data-canplay="playerCore?.canplay"
  >
    {{ formatTime(playerCore?.currentTime) }} /
    {{ formatTime(playerCore?.duration) }}
  </div>
</template>

<script setup lang="ts">
import { clsx } from '../../../../utils/clsx'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import { controlStyles } from '../../styles/common'
import { formatTime } from '../../utils/time'

const { playerCore } = usePlayerContext()

const styles = clsx({
  root: [
    controlStyles.text,
    'flex justify-center select-none',
    'px-2',
    'min-w-38',
    'text-lg',
    'text-base-content',
    'tracking-tight',
    'font-medium',
    'app-font-time',
    '[&>span]:align-middle',
  ],
})
</script>
