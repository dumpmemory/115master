/**
 * 类名处理
 * @description 此函数为了在 tailwindcss 有 language server 和 lint，因此直接返回 r 它不处理任何数据
 */
export function clsx<T>(r: T): T {
  return r
}
