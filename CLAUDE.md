# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## PROJECT OVERVIEW

**Project**: 115Master - Tampermonkey 用户脚本
**Purpose**: 增强 115 网盘的浏览和播放体验

**Tech Stack**:

- Vue 3 + TypeScript + Vite
- vite-plugin-monkey (打包工具)
- Tailwind CSS + DaisyUI (样式)
- localforage (IndexedDB 存储)

**Core Features**:

- 画质增强
- 视频缩略图预览
- 在线字幕加载
- 播放列表管理
- 快捷键系统

---

## ENVIRONMENT REQUIREMENTS

CRITICAL: 必须使用 pnpm 作为包管理器

| Requirement  | Version                       | Notes               |
| ------------ | ----------------------------- | ------------------- |
| Node.js      | >= 20.12                      | 运行时环境          |
| pnpm         | >= 9.15.9                     | REQUIRED - 强制使用 |
| Browser      | Chrome 130+ or 115Browser 35+ | 目标浏览器          |
| Tampermonkey | >= 5.3.3                      | 用户脚本管理器      |

---

## DEVELOPMENT COMMANDS

### Essential Commands

```bash
pnpm install          # 安装依赖 (MUST use pnpm)
pnpm dev              # 开发环境 (热重载)
pnpm build            # 生产构建
pnpm build:plus       # Plus 版本构建
pnpm type-check       # TypeScript 类型检查
pnpm lint             # ESLint 检查
pnpm lint:fix         # ESLint 自动修复
```

### Testing Commands

```bash
pnpm test             # 运行测试
pnpm test:watch       # 监听模式
pnpm test:coverage    # 覆盖率报告
pnpm test:ui          # Vitest UI
```

### Analysis Commands

```bash
pnpm analyze          # 构建分析 (生成 stats.html)
pnpm lint:inspector   # ESLint 配置检查器
```

---

## PROJECT ARCHITECTURE

### Core Principles

1. **页面级模块化**: 每个页面 (Home/Video/Magnet) 独立管理自己的组件、逻辑和数据
2. **修改器模式**: 首页使用 Mod 管理器 (BaseMod) 组织和隔离功能模块
3. **路由匹配**: 基于 glob 模式的路由匹配系统，非传统路由

### Directory Structure

```txt
src/
├── main.ts                    # 入口文件，路由匹配和页面初始化
├── pages/
│   ├── home/                  # 首页 (Mod 模式)
│   │   ├── BaseMod/           # 修改器基类和管理器
│   │   ├── FileListMod/       # 文件列表增强
│   │   ├── TopFilePathMod/    # 顶部路径显示
│   │   └── TopHeaderMod/      # 顶部头部增强
│   ├── video/                 # 视频播放页面
│   │   ├── components/        # 播放器组件
│   │   ├── data/              # 数据管理
│   │   └── index.vue          # 主组件
│   └── magnet/                # 磁力链接页面
├── components/
│   ├── XPlayer/               # 视频播放器核心
│   │   ├── components/        # 子组件
│   │   ├── hooks/             # 逻辑 hooks
│   │   ├── events/            # 事件系统
│   │   └── utils/             # 工具函数
│   └── ...
├── hooks/                     # 全局 hooks
├── utils/
│   ├── cache/                 # 缓存系统
│   ├── request/               # 网络请求
│   ├── drive115/              # 115 API
│   └── ...
├── constants/                 # 常量
└── types/                     # 类型定义
```

### Key Architecture Patterns

#### 1. Routing System

- 使用 `glob-to-regexp` 进行模式匹配
- 路由规则定义在 `@/main.ts`
- 每个 URL 模式对应一个页面处理函数

#### 2. Page Modes

- **Home**: Mod 模式 - 继承 `BaseMod`，实现 `destroy()` 方法
- **Video/Magnet**: Vue 组件模式 - 完整组件生命周期

#### 3. Component Organization

```txt
ComponentName/
├── components/    # 子组件
├── hooks/         # Composition API 逻辑
├── utils/         # 工具函数
├── types/         # 类型定义
├── styles/        # 样式
└── index.vue      # 主组件
```

#### 4. Cache System

- `GMRequestCache`: 缓存网络请求
- `ActressesFaceCache`: 缓存演员头像
- 基于 IndexedDB 持久化

#### 5. Player Architecture (XPlayer)

- **事件系统**: mitt 组件间通信
- **数据管理**: 分层数据流
- **快捷键**: 可配置快捷键支持
- **画质**: 支持多种画质和 HDR

---

## CODING STANDARDS

### Vue Component Rules

MUST:

- 使用 `<script setup lang="ts">` 语法
- 使用 `<style module>` CSS Modules
- 遵循模板顺序: Template -> Script -> Style
- 在 template 中使用 `:class="$style['class-name']"`

### Tailwind Class Abstraction

MUST use `clsx` utility to abstract Tailwind classes:

```typescript
import { clsx } from '@/utils/clsx'

const styles = clsx({
  container: {
    main: 'bg-base-100 flex h-full flex-col rounded-xl',
    header: 'flex items-center justify-between px-4 py-2',
  }
})
```

### TypeScript Rules

MUST:

- 优先使用 `type` 而非 `interface`
- 避免使用 `any` 和 `unknown`
- 合理使用泛型
- 组件 props 使用类型定义
- **优先使用 `type-fest` 辅助类型**:
  - `RequireAtLeastOne` - 至少需要一个属性
  - `ValueOf` - 获取对象值的类型
  - `Opaque` - 创建不透明类型
  - `Exactly` - 精确匹配对象类型
  - 更多: [type-fest 文档](https://github.com/sindresorhus/type-fest)

### Style Standards

MUST:

- 使用 DaisyUI 组件库保持一致性
- 使用 Tailwind 主题变量，避免硬编码颜色
- 确保响应式设计

#### DaisyUI Component Usage

**Reference**: [DaisyUI 官方文档](https://daisyui.com/)

**Button Components**:

- `btn` - 基础按钮
- `btn-circle` - 圆形按钮
- `btn-ghost` - 幽灵按钮
- `btn-link` - 链接按钮
- `btn-primary` / `btn-neutral` / `btn-error` - 颜色变体
- `btn-sm` / `btn-xs` / `btn-lg` - 尺寸变体

**Menu Components**:

- `menu` - 容器
- `menu-item` - 菜单项
- `menu-active` - 激活状态

**Input Components**:

- `range` - 滑动条
- `range-xs` / `range-2xs` - 尺寸
- `range-primary` - 颜色变体

**State & Loading**:

- `loading` - 加载动画
- `loading-spinner` - 旋转加载
- `skeleton` - 骨架屏

**Swap Components**:

- `swap` - 交换容器
- `swap-rotate` - 旋转交换
- `swap-active` / `swap-on` / `swap-off` - 状态控制

**Tooltip**:

- `tooltip` - 提示框
- `tooltip-top` / `tooltip-bottom` / `tooltip-left` / `tooltip-right` - 位置
- `tooltip-open` - 强制显示

**Utilities**:

- `divider` - 分割线
- `text-base-content` - 文本颜色
- `bg-base-100` / `bg-base-200` - 背景颜色

#### Icon Usage Standards

**Icon Library**: `@iconify/vue`

**Primary Icon Sets**:

- `material-symbols` (主要)
- `lucide`
- `solar`
- `line-md`
- `heroicons`
- `bytesize`
- `gis`
- `mdi`

**Management Rules**:

1. 集中定义在:
   - `@/icons/index.ts`
   - `@/components/XPlayer/icons/icons.const.ts`
2. 命名约定: `ICON_` 前缀 + 语义化名称
   - Example: `ICON_PLAY`, `ICON_SETTINGS`

**Usage**:

```vue
<Icon :icon="ICONS.ICON_PLAY" class="size-6" />
```

**Size Standards**:

- General: `size-6` (24px)
- Small: `size-4` / `size-5`
- Button: `size-7`
- Large: `size-10`

**Style Notes**:

- 图标继承父元素颜色: `fill: currentColor`
- 使用 Tailwind 文本颜色类控制颜色
- 可添加过渡动画: `transition-transform`, `rotate-90`

### Git Hooks

- **Pre-commit**: 自动运行类型检查和 lint-staged
- **Lint-staged**: 对暂存文件自动修复代码风格

---

## COMMON TASKS

### Add New Page

1. 在 `@/pages/` 创建页面目录
2. 在 `@/constants/route.match.ts` 添加路由匹配规则
3. 在 `@/main.ts` 的 `routeMatch` 数组中注册页面

### Add New Mod (Home Feature)

1. 在 `@/pages/home/` 创建 Mod 目录
2. 创建类继承 `BaseMod`，实现 `destroy()` 方法
3. 在 `@/pages/home/index.ts` 的 `ModManager` 中注册

### Add Player Feature

1. 在 `@/components/XPlayer/components/` 添加子组件
2. 在 `@/components/XPlayer/hooks/` 添加逻辑
3. 在 `@/components/XPlayer/events/` 注册事件

### Add Cache

1. 在 `@/utils/cache/` 创建缓存类
2. 继承或参考 `GMRequestCache` 实现
3. 使用 `localforage` 持久化存储

---

## IMPORTANT CONFIGURATIONS

### vite-plugin-monkey

- **Entry**: `@/main.ts`
- **Output**: `dist/115master.user.js`
- **CDN**: 使用 CDN 加载外部依赖 (vue, lodash, localforage)
- **CORS**: 配置跨域访问域名和资源

### TypeScript

- `tsconfig.json`: 项目引用配置
- `tsconfig.app.json`: 应用代码配置
- `tsconfig.node.json`: 构建脚本配置
- **Custom Transformer**: `@libmedia/cheap`

### ESLint

- **Base**: `@antfu/eslint-config`
- **Tailwind CSS**: 启用 Tailwind CSS 插件
- **Block Order**: 强制 template -> script -> style
- **Comments**: 自动转换为 JSDoc 风格

### Path Alias

**Alias**: `@/*` → `src/*`

**导入规则**:

```typescript
// ✅ 跨目录 - 使用 @/ 别名
import { usePlayerProvide } from '@/components/XPlayer/hooks/usePlayerProvide'
import { cache } from '@/utils/cache/core'

// ✅ 同目录或子目录 - 使用相对路径
import { BaseMod } from './BaseMod'
import { useContextMenu } from './hooks/useContextMenu'
```

---

## SPECIAL NOTES

### Plus Version

通过 `VITE_PLUS_VERSION=true` 环境变量构建，包含额外功能

### 115 API

- API 封装在 `@/utils/drive115/`
- 使用 GM_xmlhttpRequest 进行跨域请求
- 注意 API 限制和缓存策略

### Subtitle System

- 支持在线字幕加载
- 字幕源配置在 `@/utils/subtitle/`
- 支持多种字幕格式

### Video Thumbnails

- **IMPORTANT**: 使用 `M3U8ClipperNew` 解析 HLS (m3u8) 视频流
- 使用 WebCodecs API (VideoFrame) 提取视频帧
- 自动采样和缓存缩略图，可配置采样间隔

---

## DEPENDENCY GUIDELINES

### Query Documentation

MUST: 当需要依赖库文档时，使用以下方式主动查询：

- **WebSearch**: 搜索官方文档
- **WebFetch**: 获取文档页面内容
- **package.json**: 查看依赖版本和仓库链接

### Key Dependencies Reference

**Framework**: Vue 3, Vite, TypeScript
**Styling**: Tailwind CSS, DaisyUI
**Vue Ecosystem**: @vueuse/core, @iconify/vue
**Utilities**: lodash, dayjs, mitt, localforage, type-fest
**Video**: @libmedia/\*, hls.js, m3u8-parser
**Testing**: Vitest
**Linting**: ESLint, @antfu/eslint-config
