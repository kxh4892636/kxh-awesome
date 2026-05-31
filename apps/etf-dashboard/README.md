# etf-dashboard

React + Ant Design + Hono RPC ETF 看板。

- 标的切换
- 日/周/月/季/年 K 线
- 范围、均线、缩放、拖拽和 tooltip

接口请求使用 Hono RPC，并复用 `@kxh-awesome/etf-service/rpc` 导出的 Zod schema 和 TS 类型做请求、响应校验。

```bash
vp install
vp dev
```

默认后端地址为 `http://localhost:8080`，可通过 `VITE_API_BASE_URL` 覆盖。
