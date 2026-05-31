# react-hono-template

React 19 SPA 前端模板。

## 技术栈

- **React 19** + TypeScript 6
- **Vite** + Tailwind CSS 4
- **Ant Design** — React 组件库
- **TanStack Router** — 路由
- **TanStack Query** — 数据请求
- **Zustand** — 状态管理
- **Hono RPC** — 类型安全 API 客户端
- **Zod** — 请求和响应运行时校验

## 快速开始

```bash
# 安装依赖
vp install

# 先启动后端
cd ../hono-template
vp run dev

# 启动前端
cd ../react-hono-template
vp dev
```

开发服务器启动后访问 `http://localhost:5173`。

## 接口集成

前端通过 `@kxh-awesome/hono-template/rpc` 的 `hcWithType` 创建 Hono RPC 客户端。
请求封装在 `src/api/posts.ts`，schema 和 TS 类型复用 `@kxh-awesome/hono-template/rpc` 导出的 schema，调用前校验请求参数，收到响应后再次校验响应结构。

前端 `tsconfig.json` 通过 `references` 指向 `../hono-template`，直接拿到后端 TS 类型。
Hono RPC 类型入口在后端按 `ReturnType<typeof hc<typeof app>>` 预计算，前端构建使用 `tsc -b`。
