<template>
  <div :class="[styles.root]">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { clsx } from '@/utils/clsx'

const styles = clsx({
  root: [
    'flex items-center',
    'px-1',
    'min-h-10',
    'rounded-full',
    'bg-base-100/50',
    'relative',
    'app-glass-border',
  ],
})
</script>
