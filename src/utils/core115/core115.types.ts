/**
 * 模拟 jQuery 对象，用于 115 SDK
 */
export interface MockjQueryObject {
  attr: (key: string) => string
}

/**
 * TreeDG 目录树选择对话框
 */
interface TreeDG {
  /**
   * 显示目录选择对话框
   * @param options 配置选项
   */
  Show: (options: {
    /** 文件列表（每个元素需要包含 file_type, file_id, cate_id, area_id 等属性） */
    list: MockjQueryObject[]
    /** 操作类型：move-移动, copy-复制 */
    type?: 'move' | 'copy'
    /** 是否包含目录 */
    has_dir?: boolean
    /** 目标窗口（可选） */
    win?: any
    /** 完成回调 */
    callback?: (result?: any) => void
  }) => void
}

/**
 * Core SDK 主接口
 */
export interface Core {
  /** 其他 Core 模块... */
  [key: string]: any
  TreeDG: TreeDG
}
