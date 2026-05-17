# react-template

React 19 SPA 前端模板。

## 技术栈

- **React 19** + TypeScript 6
- **Vite** + Tailwind CSS 4
- **shadcn/ui** — Radix base + Tailwind 组件源码
- **TanStack Router** — 路由
- **TanStack Query** — 数据请求
- **Zustand** — 状态管理
- **ConnectRPC** — 类型安全 RPC 客户端

## 快速开始

```bash
# 安装依赖
vp install

# 生成后端接口代码（传入后端项目名）
vp run gen:api go-template

# 启动开发服务器
vp dev

# 添加 shadcn/ui 组件
vp dlx -- shadcn@latest add button
```

开发服务器启动后访问 `http://localhost:5173`。

## 项目结构

```
react-template/
├── src/
│   ├── api/                    # ConnectRPC 客户端
│   │   ├── client.ts           # Transport 配置
│   │   └── gen/                # 生成代码（只读）
│   │       └── go-template/    # 对应后端项目
│   ├── hooks/                  # 数据 hooks
│   ├── components/ui/           # shadcn/ui 组件源码
│   ├── lib/utils.ts             # shadcn cn 工具
│   ├── pages/                  # 页面组件
│   ├── routes/                 # TanStack Router 路由
│   └── stores/                 # Zustand 状态
└── vite.config.ts
```

## 接口集成

修改后端 proto 后，重新生成前端接口代码：

```bash
vp run gen:api go-template
```

产物固定输出到 `src/api/gen/go-template/`，前端直接 import 使用，编译时保证类型安全。
