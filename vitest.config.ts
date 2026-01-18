import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    // 测试环境
    environment: 'node',
    // 测试文件匹配模式
    include: ['**/__tests__/**/*.test.ts'],
    // 代码覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
})
