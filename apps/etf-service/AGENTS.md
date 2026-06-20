# etf-service

## 技术栈与架构入口

- Node.js Hono 后端，使用 TypeScript 6、Zod、Drizzle ORM、SQLite/libsql 和 tsdown。
- `src/main.ts` 启动 Node server。
- `src/app.ts` 创建 Hono app、挂载 CORS/logger/error handler，并把 API 挂到 `/api`。
- `src/routes/index.ts` 组装服务实例并注入到路由。
- `package.json#exports["./rpc"]` 是前端依赖的类型安全入口。

## 关键模块

- `src/routes/`：对外 API 路由，只负责请求校验、调用服务和响应校验。
- `src/routes/*/schema.ts`：请求与响应 Zod schema，是前后端共享契约的一部分。
- `src/services/market/`：行情服务接口和实现，负责缓存刷新、日期裁剪、休市标记和查询编排。
- `src/services/securities/`：证券查询服务，当前适配 `marketService.listSecurities`。
- `src/repositories/market-repository.ts`：行情持久化访问边界。
- `src/db/schema/`：Drizzle schema 源头。
- `src/libs/hongsehuojian.ts`、`src/libs/kline-parser.ts`：外部行情源和 K 线解析封装。
- `src/config/env.ts`、`src/config/securities.ts`：环境变量和支持证券配置。
- `src/rpc/`：导出 Hono RPC client 类型和 schema，前端不要直接 import `src/app.ts`。

## 对外接口

- `GET /`：健康信息。
- `POST /api/securities/list`：列出支持的证券。
- `POST /api/market/getDailyBars`：查询日线 K 线数据。
- `@kxh-awesome/etf-service/rpc`：workspace 内前端使用的 Hono RPC 类型和 schema 入口。

## 依赖关系

- 被 `apps/etf-dashboard` 通过 `@kxh-awesome/etf-service/rpc` 依赖。
- 不依赖其他 workspace 应用。
- 运行时依赖本地 SQLite 数据文件和外部行情源封装。

## 项目命令

- `vp run dev`：监听启动 `src/main.ts`。
- `vp run build`：类型检查、tsdown 打包并生成声明文件。
- `vp run start`：运行 `dist/main.mjs`。
- `vp run test`：运行 `src/**/*.test.ts`。
- `vp run check`：运行 Vite+ 检查。
- `vp run db:generate`、`vp run db:migrate`：Drizzle 迁移相关命令。

## 生成物

- `dist/`、`logs/`、`node_modules/` 和 `*.tsbuildinfo` 不手动编辑。
- `data/` 下 SQLite 文件是运行数据，不把手工编辑作为常规开发路径。

## 验证方式

- 普通后端改动运行 `vp run build`。
- 改 `src/libs/`、`src/services/` 或测试覆盖的逻辑时运行 `vp run test`。
- 改 schema、RPC 导出或路由时，同时验证依赖方 `apps/etf-dashboard` 的 `vp run build`。
