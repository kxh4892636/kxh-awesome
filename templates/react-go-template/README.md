# react-go-template

React + Ant Design + ConnectRPC + Connect Query 前端模板，页面结构与后端 RPC 类型保留 Go 模板链路：

- `dayjs` 实时时钟
- `Zustand` 计数器
- `TanStack Query` 文章列表

接口请求使用 Connect Query，并通过 `src/api/gen/go-template/` 中的 query descriptor 调用后端服务。

```bash
vp install
vp run gen
vp dev
```

默认后端地址为 `http://localhost:8080`，可通过 `VITE_API_BASE_URL` 覆盖。

`connectrpc.config.json` 维护后端 IDL 映射，`vp run gen` 会为配置里的所有后端生成 RPC client。
