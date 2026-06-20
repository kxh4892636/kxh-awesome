# hono-template

## 技术栈与架构入口

- Node.js Hono 后端模板，使用 TypeScript 6、Zod、Drizzle ORM、SQLite/libsql 和 tsdown。
- `src/main.ts` 启动 Node server。
- `src/app.ts` 创建 Hono app、挂载 CORS/logger/error handler，并把 API 挂到 `/api`。
- `src/routes/index.ts` 注入 `postsService` 并挂载 posts 路由。
- `package.json#exports["./rpc"]` 是前端模板依赖的类型安全入口。

## 关键模块

- `src/routes/posts/index.ts`：对外 posts API 路由。
- `src/routes/posts/schema.ts`：请求和响应 Zod schema。
- `src/routes/posts/types.ts`：路由依赖的服务接口类型。
- `src/services/posts.ts`：posts 业务实现，当前通过 Drizzle 查询 SQLite。
- `src/db/client.ts`、`src/db/setup.ts`、`src/db/seed.ts`：数据库连接、初始化和种子数据。
- `src/db/schema/`：Drizzle schema 源头。
- `src/rpc/`：导出 Hono RPC client 类型和 schema，前端不要直接 import `src/app.ts`。

## 对外接口

- `GET /`：健康信息。
- `POST /api/posts/getPosts`：按请求参数返回 posts 列表。
- `@kxh-awesome/hono-template/rpc`：workspace 内前端使用的 Hono RPC 类型和 schema 入口。

## 依赖关系

- 被 `templates/react-hono-template` 通过 `@kxh-awesome/hono-template/rpc` 依赖。
- 不依赖其他 workspace 应用。
- 运行时依赖本地 SQLite 数据文件。

## 项目命令

- `vp run dev`：监听启动 `src/main.ts`。
- `vp run build`：类型检查、tsdown 打包并生成声明文件。
- `vp run start`：运行 `dist/main.mjs`。
- `vp run test`：运行 `src/**/*.test.ts`。
- `vp run check`：运行 Vite+ 检查。
- `vp run db:generate`、`vp run db:migrate`：Drizzle 迁移相关命令。

## 生成物

- `dist/`、`data/`、`node_modules/` 和 `*.tsbuildinfo` 不手动编辑。

## 验证方式

- 普通后端改动运行 `vp run build`。
- 改 posts 路由、schema 或服务逻辑时运行 `vp run test`。
- 改 `./rpc` 导出或 schema 时，同时验证 `templates/react-hono-template` 的 `vp run build`。
