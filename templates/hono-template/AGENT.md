# hono-template

Node.js Hono 后端模板。

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

SQLite 文件固定保存到 `templates/hono-template/data/hono-template.sqlite`。
启动服务或运行测试时会自动创建 `data/` 目录、初始化 `posts` 表并写入示例数据。

## RPC 类型优化

Hono RPC 的对外入口在 `src/rpc/index.ts`，通过 package `exports` 暴露为 `@kxh-awesome/hono-template/rpc`。
`src/rpc/client.ts` 按 Hono 官方推荐用 `ReturnType<typeof hc<typeof app>>` 预计算客户端类型，让 `tsc` 承担大型路由类型实例化工作。

大型项目继续按业务域拆分路由，并保持“路由工厂 + 服务接口注入”模式；前端应只依赖 `/rpc` 前缀导出的 client 和 schema，不要直接导入后端 `src/app.ts`。
