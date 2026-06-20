# etf-dashboard

## 技术栈与架构入口

- React 19 + TypeScript 6 + Vite + Tailwind CSS 4 + Ant Design。
- 使用 TanStack Router、TanStack Query、Zustand、Hono RPC 和 Zod。
- `src/main.tsx` 挂载 React 应用。
- `src/app.tsx` 组装 Ant Design、TanStack Query 和 TanStack Router provider。
- `src/routes/index.tsx` 定义路由树。

## 关键模块

- `src/routes/index.tsx`：真实路由定义，新增页面先确认路由树。
- `src/routes/lazy/home.lazy.tsx`：`/` 的 lazy route 入口。
- `src/pages/index.tsx`：根布局。
- `src/pages/home-page/`：ETF 看板页面和图表组件。
- `src/api/client.ts`：Hono RPC 客户端，统一读取 `VITE_API_BASE_URL`，默认 `http://localhost:8080`。
- `src/hooks/use-market.ts`：TanStack Query 数据 hooks，负责调用后端并用后端导出的 Zod schema 校验响应。
- `src/utils/`：图表数据和格式化工具。

## 路由

- 当前只有 `/` 路由。
- `/` 在 `src/routes/index.tsx` 中声明，并 lazy 加载 `src/routes/lazy/home.lazy.tsx`。
- `home.lazy.tsx` 渲染 `src/pages/home-page/index.tsx`。

## 依赖关系

- 依赖 workspace 后端 `@kxh-awesome/etf-service`。
- 前端通过 `@kxh-awesome/etf-service/rpc` 的 `hcWithType` 创建 Hono RPC 客户端。
- `tsconfig.json` references 指向 `../etf-service/tsconfig.build.json`，后端 RPC 类型变更后应先验证后端构建。

## 项目命令

- `vp run dev`：启动前端开发服务器。
- `vp run build`：执行 `tsc -b && vp build`。
- `vp run preview`：预览构建产物。
- `vp run check`：运行 Vite+ 检查。

## 生成物

- `dist/`、`logs/`、`node_modules/` 和 `*.tsbuildinfo` 不手动编辑。

## 验证方式

- 普通前端改动运行 `vp run build`。
- 改 RPC 调用、schema 或后端导出类型时，先在 `apps/etf-service` 运行 `vp run build`，再回到本项目运行 `vp run build`。
- 涉及交互或图表行为时，启动后端和前端后在浏览器验证核心页面。
