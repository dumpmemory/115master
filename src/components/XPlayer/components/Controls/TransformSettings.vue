<template>
  <div class="card card-sm">
    <div class="card-body">
      <h3 class="card-title">
        旋转与翻转
      </h3>
      <div>
        <!-- 旋转控制 -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend w-full">
            旋转 <span class="badge badge-sm">{{ transform.rotate.value }}°</span>
          </legend>
          <div class="flex gap-2">
            <button
              class="btn btn-sm join-item flex-1"
              :disabled="transform.rotate.value === -270"
              @click="transform.left"
            >
              <Icon :icon="ICONS.ICON_ROTATE_LEFT" class="size-4" />
            </button>
            <button class="btn btn-sm join-item flex-1" @click="transform.normal">
              <Icon :icon="ICONS.ICON_ROTATE_NORMAL" class="size-4" />
            </button>
            <button
              class="btn btn-sm join-item flex-1"
              :disabled="transform.rotate.value === 270"
              @click="transform.right"
            >
              <Icon :icon="ICONS.ICON_ROTATE_RIGHT" class="size-4" />
            </button>
          </div>
        </fieldset>

        <!-- 翻转控制 -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            翻转
          </legend>
          <div class="flex gap-2">
            <button
              class="btn btn-sm flex-1"
              :class="{ 'btn-primary': transform.flipX.value }"
              @click="transform.toggleFlipX"
            >
              <div class="rotate-90 transform">
                <Icon :icon="ICONS.ICON_FLIP_X" class="size-4" />
              </div>
              水平
            </button>
            <button
              class="btn btn-sm flex-1"
              :class="{ 'btn-primary': transform.flipY.value }"
              @click="transform.toggleFlipY"
            >
              <Icon :icon="ICONS.ICON_FLIP_Y" class="size-4" />
              垂直
            </button>
          </div>
        </fieldset>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { ICONS } from '@/components/XPlayer/index.const'

const { transform } = usePlayerContext()
</script>
