import type { Ref } from 'vue'
import { useMouseInElement } from '@vueuse/core'
import { watch } from 'vue'
import { usePlayerContext } from './usePlayerProvide'

/**
 * 控制栏鼠标检测 Hook
 */
export function useControlsMouseDetection(elementRef: Ref<HTMLElement | null>) {
  const { controls } = usePlayerContext()

  const { isOutside } = useMouseInElement(elementRef)

  watch(isOutside, (isOutside, _, onCleanup) => {
    if (!isOutside) {
      controls.setHovering(true)

      onCleanup(() => {
        controls.setHovering(false)
      })
    }
  })

  return {
    isOutside,
  }
}
