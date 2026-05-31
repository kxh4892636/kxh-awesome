# etf-service

ETF 看板后端服务，基于 Node.js + Hono RPC + SQLite。

- 启动时从 `data/*.json` 导入历史全量数据。
- 用户访问时优先读取 SQLite，缺少有效日期数据时再拉取远端日线并入库。
- 当天数据不入库、不返回。

初始 JSON 和 SQLite 运行数据都在 `data/` 目录下；其中 `*.json` 用于初始化入库，`*.sqlite*` 是本地运行文件。

```bash
vp install
vp run dev
```

API 地址：

- `GET /` 健康检查
- `POST /api/securities/list` 获取标的列表
- `POST /api/market/getDailyBars` 获取日线数据

前端通过 `@kxh-awesome/etf-service/rpc` 导入 `hcWithType` 和共享 schema。
