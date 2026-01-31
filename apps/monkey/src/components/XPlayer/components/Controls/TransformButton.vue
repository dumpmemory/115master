<template>
  <button
    ref="buttonRef"
    :class="[styles.btn.root]"
    title="画面变换"
    @click="toggleMenu"
  >
    <Icon
      class="transition-transform"
      :class="[
        styles.btn.icon,
        {
          'rotate-90': menuVisible,
        },
      ]"
      :icon="ICONS.ICON_TRANSFORM"
    />
  </button>
  <Popup
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
    :class="[styles.popup]"
  >
    <TransformSettings />
  </Popup>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { shallowRef } from 'vue'
import Popup from '@/components/XPlayer/components/Popup/index.vue'
import { ICONS } from '@/components/XPlayer/index.const'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { clsx } from '@/utils/clsx'
import TransformSettings from './TransformSettings.vue'

const styles = clsx({
  ...controlStyles,
  popup: [
    'p-2',
    'select-none',
  ],
})

const buttonRef = shallowRef<HTMLElement>()
const menuVisible = shallowRef(false)
function toggleMenu() {
  menuVisible.value = !menuVisible.value
}
</script>
