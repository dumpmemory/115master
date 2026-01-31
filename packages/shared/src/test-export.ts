/**
 * 测试导出变量
 * 用于验证 monorepo 包引用是否正常工作
 */

/**
 * 测试用的常量值
 */
export const TEST_VALUE = 'Hello from @115master/shared!' as const

/**
 * 问候语模板函数
 * @param name - 名称
 * @returns 问候语
 */
export function GREETING(name: string): string {
  return `Hello, ${name}! Welcome to 115Master.`
}
