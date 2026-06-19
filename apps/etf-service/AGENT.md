# etf-service

ETF 看板 Node.js Hono 后端。

## 技术栈

- **Hono** — Node.js adapter + Hono RPC
- **TypeScript 6** — strict mode
- **Zod** — 请求、响应和环境变量校验
- **Drizzle ORM** — SQLite ORM
- **@libsql/client** — 本地 SQLite 文件 driver

## 快速开始

```bash
# 安装依赖
vp install

# 启动开发服务器
vp run dev

# 构建
vp run build

# 测试
vp run test
```

服务启动后监听 `http://localhost:8080`。

## 数据库

SQLite 文件默认保存到 `apps/etf-service/data/etf-service.sqlite`。

## RPC 类型优化

Hono RPC 的对外入口在 `src/rpc/index.ts`，通过 package `exports` 暴露为 `@kxh-awesome/etf-service/rpc`。
`src/rpc/client.ts` 按 Hono 官方推荐用 `ReturnType<typeof hc<typeof app>>` 预计算客户端类型，让 `tsc` 承担大型路由类型实例化工作。

大型项目继续按业务域拆分路由，并保持“路由工厂 + 服务接口注入”模式；前端应只依赖 `/rpc` 前缀导出的 client 和 schema，不要直接导入后端 `src/app.ts`。

## 验证方法

开发完成后，通过构建命令验证后端无错误：

```bash
cd apps/etf-service
vp run build
```

构建必须零错误完成：

- exit code 为 0；
- 输出中无 `error`、`ERROR` 或 TypeScript 编译错误（`TS*`）；
- 构建产物输出到 `dist/` 目录，确保 `tsdown` 编译通过且类型声明（`.d.ts`）已生成。
