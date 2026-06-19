# etf-dashboard

React 19 ETF 看板前端。

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
cd ../etf-service
vp run dev

# 启动前端
cd ../etf-dashboard
vp dev
```

开发服务器启动后访问 `http://localhost:5173`。

## 接口集成

前端通过 `@kxh-awesome/etf-service/rpc` 的 `hcWithType` 创建 Hono RPC 客户端。
请求封装在 `src/api/market.ts`，schema 和 TS 类型复用 `@kxh-awesome/etf-service/rpc` 导出的 schema，调用前校验请求参数，收到响应后再次校验响应结构。

前端 `tsconfig.json` 通过 `references` 指向 `../etf-service`，直接拿到后端 TS 类型。
Hono RPC 类型入口在后端按 `ReturnType<typeof hc<typeof app>>` 预计算，前端构建使用 `tsc -b`。

## 验证方法

开发完成后，通过构建命令验证前端无错误：

```bash
cd apps/etf-dashboard
vp run build
```

构建必须零错误完成：

- exit code 为 0；
- 输出中无 `error`、`ERROR` 或 TypeScript 编译错误（`TS*`）；
- 如果后端 RPC 类型有变更，需先在 `etf-service` 执行 `vp run build` 确保类型可用，再验证前端构建。
