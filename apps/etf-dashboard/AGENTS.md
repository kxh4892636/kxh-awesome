# etf-dashboard

## 技术栈与架构入口

- React 19 + TypeScript 6 + Vite + Tailwind CSS 4 + Ant Design。
- 使用 TanStack Router、TanStack Query、Zustand、ConnectRPC 和 Connect Query。
- `src/main.tsx` 挂载 React 应用。
- `src/app.tsx` 组装 Ant Design、TanStack Query 和 TanStack Router provider。
- `src/routes/index.tsx` 定义路由树。

## 关键模块

- `src/routes/index.tsx`：真实路由定义，新增页面先确认路由树。
- `src/routes/lazy/home.lazy.tsx`：`/` 的 lazy route 入口。
- `src/pages/index.tsx`：根布局。
- `src/pages/home-page/`：ETF 看板页面和图表组件。
- `connectrpc.config.json`：后端 IDL 到前端生成目录的映射。
- `scripts/gen-rpc-client.mjs`：根据配置生成 ConnectRPC TypeScript client。
- `src/api/gen/etf-service/`：ConnectRPC TypeScript API 客户端，只读。
- `src/hooks/use-market.ts`：Connect Query 数据 hooks，负责调用 Go 后端。
- `src/utils/`：图表数据和格式化工具。

## 路由

- 当前只有 `/` 路由。
- `/` 在 `src/routes/index.tsx` 中声明，并 lazy 加载 `src/routes/lazy/home.lazy.tsx`。
- `home.lazy.tsx` 渲染 `src/pages/home-page/index.tsx`。

## 依赖关系

- 依赖 `apps/etf-service` 提供的 ConnectRPC proto 契约。
- 不通过 workspace import 后端 Go 代码，接口契约来自 `src/api/gen/etf-service/` 生成产物。

## 项目命令

- `vp run dev`：启动前端开发服务器。
- `vp run gen`：根据 `connectrpc.config.json` 生成全部后端 RPC client。
- `vp run build`：执行 `tsc -b && vp build`。
- `vp run preview`：预览构建产物。
- `vp run check`：运行 Vite+ 检查。

## 生成物

- `dist/`、`logs/`、`node_modules/`、`*.tsbuildinfo` 和 `src/api/gen/etf-service/` 不手动编辑。

## 验证方式

- 普通前端改动运行 `vp run build`。
- 改后端 proto 后，先在 `apps/etf-service` 运行 `./generate.sh` 和 `go test ./...`，再回到本项目运行 `vp run gen` 和 `vp run build`。
- 涉及交互或图表行为时，启动后端和前端后在浏览器验证核心页面。
