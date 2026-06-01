# react-hono-template

React + Ant Design + Hono RPC 前端模板，页面结构与 `react-go-template` 保持一致：

- `dayjs` 实时时钟
- `Zustand` 计数器
- `TanStack Query` 文章列表

接口请求使用 Hono RPC，并复用 `@kxh-awesome/hono-template/rpc` 导出的 Zod schema 和 TS 类型做请求、响应校验。

```bash
vp install
vp dev
```

默认后端地址为 `http://localhost:8080`，可通过 `VITE_API_BASE_URL` 覆盖。
