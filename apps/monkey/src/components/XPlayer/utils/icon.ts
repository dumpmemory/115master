import { ICONS } from '@/components/XPlayer/index.const'

/**
 * 获取音量图标 Symbol
 * @param volume 音量
 * @param muted 是否静音
 * @returns 音量图标 Symbol
 */
export function getVolumeIcon(volume = 0, muted = false): string {
  if (muted) {
    return ICONS.ICON_VOLUME_OFF
  }

  if (volume === 0) {
    return ICONS.ICON_VOLUME_MUTE
  }

  if (volume < 50) {
    return ICONS.ICON_VOLUME_DOWN
  }

  return ICONS.ICON_VOLUME_UP
}
