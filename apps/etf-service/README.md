# etf-service

ETF 看板后端服务，基于 Node.js + Hono RPC + SQLite。

```bash
vp install
vp run dev
```

API 地址：

- `GET /` 健康检查
- `POST /api/securities/list` 获取标的列表
- `POST /api/market/getDailyBars` 获取日线数据

前端通过 `@kxh-awesome/etf-service/rpc` 导入 `hcWithType` 和共享 schema。
