import type { PlayerContext } from '../../../../components/XPlayer/hooks/usePlayerProvide'

export interface FileAction {
  label: string
  icon: string
  iconColor?: string
  onAction: (ctx: PlayerContext) => void | Promise<void>
}

export interface FileActionMenuProps {
  actions: FileAction[]
  ctx: PlayerContext
}
