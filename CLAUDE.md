# Power Platform Object Explorer

## 项目概述

Power Platform Object Explorer 是一个专业的 Web 应用程序，用于浏览和探索 Microsoft Power Platform / Dynamics 365 组件。该项目提供了一个现代化、高性能的界面来查看、搜索和管理各种 Power Platform 对象，包括实体、表单、视图、工作流、插件、流程、应用和安全角色等。

该应用直接连接到 Dynamics 365 Web API (v9.2)，实时获取和展示组件数据，支持高级搜索、分页加载、缓存优化等企业级功能。

## 技术栈

- **前端框架**: React 19.0.0
- **开发语言**: TypeScript 5.9.3
- **构建工具**: Vite 6.0.3
- **样式方案**: Tailwind CSS 4.1.18
- **UI 组件库**: shadcn/ui (基于 Radix UI)
- **动画库**: Framer Motion 12.23.26
- **图标库**: Lucide React 0.561.0
- **通知组件**: Sonner 2.0.7
- **包管理器**: pnpm (推荐)

## 项目结构

```
powerplatform-object-explorer/
├── src/
│   ├── components/
│   │   └── ui/              # shadcn/ui 组件库
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── command.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── scroll-area.tsx
│   │       ├── separator.tsx
│   │       ├── skeleton.tsx
│   │       ├── switch.tsx
│   │       └── tabs.tsx
│   ├── services/
│   │   ├── api/             # D365 Web API 客户端
│   │   │   ├── d365ApiClient.ts      # API 客户端实现
│   │   │   ├── d365ApiConfig.ts      # API 配置和端点
│   │   │   └── d365ApiTypes.ts       # API 类型定义
│   │   ├── dataServices/    # 数据服务层
│   │   │   ├── entityService.ts      # 实体服务
│   │   │   ├── formService.ts        # 表单服务
│   │   │   ├── viewService.ts        # 视图服务
│   │   │   ├── workflowService.ts    # 工作流服务
│   │   │   ├── flowService.ts        # 云流服务
│   │   │   ├── pluginService.ts      # 插件服务
│   │   │   ├── webResourceService.ts # Web 资源服务
│   │   │   ├── appService.ts         # 应用服务
│   │   │   ├── securityRoleService.ts # 安全角色服务
│   │   │   ├── solutionService.ts    # 解决方案服务
│   │   │   ├── categoryService.ts    # 分类服务
│   │   │   ├── environmentService.ts # 环境服务
│   │   │   └── searchService.ts      # 搜索服务
│   │   ├── transformers/    # 数据转换器
│   │   │   ├── componentTransformer.ts
│   │   │   └── searchTransformer.ts
│   │   └── cacheService.ts  # 缓存服务
│   ├── hooks/               # 自定义 React Hooks
│   │   ├── useComponentData.ts
│   │   └── useCategoryData.ts
│   ├── utils/               # 工具函数
│   │   ├── errorHandler.ts
│   │   └── odataHelper.ts
│   ├── data/                # 数据类型定义
│   │   └── mockData.ts
│   ├── lib/                 # 库工具
│   │   └── utils.ts
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # 全局样式
├── package.json             # 项目依赖和脚本
├── tsconfig.json            # TypeScript 配置
├── vite.config.ts           # Vite 配置
├── tailwind.config.js       # Tailwind CSS 配置
└── CLAUDE.md                # 本文件 - AI 助手指南
```

## 核心功能

### 已实现功能

#### 1. **组件浏览**
   - 全部组件 (All Components)
   - 实体 (Entities)
   - 表单 (Forms)
   - 视图 (Views)
   - 工作流 (Workflows)
   - 流程 (Flows)
   - 插件 (Plugins)
   - Web 资源 (Web Resources)
   - 应用 (Apps)
   - 安全角色 (Security Roles)

#### 2. **搜索与筛选**
   - Command Palette (⌘K / Ctrl+K) 快速搜索
   - 实时搜索组件
   - 按分类筛选
   - 搜索结果分组显示
   - 防抖优化（300ms）

#### 3. **组件详情**
   - 详细信息查看
   - 元数据展示
   - 属性列表
   - 依赖关系
   - 所属 Solution 信息
   - 多标签页组织（Overview, Properties, Dependencies, Solutions）

#### 4. **Dynamics 365 API 集成**
   - 完整的 Web API v9.2 客户端实现
   - 自动重试机制（指数退避）
   - 请求去重优化
   - 超时控制（30s）
   - 错误分类和处理
   - OData 查询支持

#### 5. **性能优化**
   - 智能缓存策略（5-15分钟 TTL）
   - 分页加载（50 条/页）
   - 懒加载更多
   - 请求防抖和节流
   - 骨架屏加载状态

#### 6. **用户体验**
   - 响应式设计（支持移动端）
   - 深色/浅色模式切换
   - 流畅的动画效果（Framer Motion）
   - Toast 通知提示
   - 错误提示和重试按钮
   - 加载状态指示器

#### 7. **高级功能**
   - Solution 组件关联查询
   - Flow Editor 直接跳转
   - 环境 ID 自动获取
   - 组件类型智能识别
   - 数据实时刷新

#### TypeScript 规范
- 启用严格模式 (`strict: true`)
- 使用接口定义数据结构
- 避免使用 `any` 类型
- 为函数提供完整的类型注解

#### 组件开发规范
- 使用函数式组件
- 优先使用自定义 Hooks 提取逻辑
- Props 使用 TypeScript 接口定义
- 组件文件使用 `.tsx` 扩展名

#### 样式规范
- 使用 Tailwind CSS 工具类
- 遵循 shadcn/ui 设计系统
- 响应式设计使用 Tailwind 断点
- 深色模式使用 `dark:` 前缀


## API 集成说明

### Dynamics 365 Web API

应用使用 Dynamics 365 Web API (v9.2) 获取数据：
- **Base URL**: `/api/data/v9.2/`
- **认证**: 使用浏览器会话认证（需要用户已登录 D365）
- **CORS**: 应用需要部署在 D365 环境或配置 CORS

### 特殊功能实现

#### Flow Editor 跳转
- 获取 Flow 的 `workflowidunique` 和 `solutionid`
- 调用 `RetrieveCurrentOrganization(AccessType='Default')` 获取环境 ID
- 构造 URL: `https://make.powerautomate.com/environments/{envId}/solutions/{solutionId}/flows/{workflowId}`

#### Solution 组件关联
- 使用 `solutioncomponents` 端点查询组件所属的解决方案
- 使用 `$expand` 获取解决方案详细信息
- 支持 Managed 和 Unmanaged 解决方案

## 资源链接

### 官方文档
- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Vite 文档](https://vitejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [shadcn/ui 文档](https://ui.shadcn.com/)

### Power Platform
- [Power Platform 文档](https://learn.microsoft.com/en-us/power-platform/)
- [Dataverse Web API](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview)
- [OData 查询文档](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query-data-web-api)

### 工具库
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [Radix UI](https://www.radix-ui.com/)

## AI 助手使用指南

当 AI 助手（如 Claude）帮助开发此项目时：

### 开发原则
1. **类型安全**: 始终使用 TypeScript，避免 `any` 类型
2. **代码质量**: 遵循现有的代码风格和架构模式
3. **性能优先**: 考虑缓存、分页、防抖等性能优化
4. **用户体验**: 提供加载状态、错误提示、流畅动画
5. **可维护性**: 编写清晰的代码和注释，保持模块化

### 常见任务
- 添加新组件类型：参考现有 Service 和 Transformer
- 修改 UI：使用 Tailwind 和 shadcn/ui 组件
- 优化性能：关注缓存、请求优化、渲染优化
- 修复 Bug：检查类型错误、API 响应、数据转换

### 注意事项
- 保持与现有架构一致
- 不要破坏现有功能
- 添加适当的错误处理
- 更新相关文档
