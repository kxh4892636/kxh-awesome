# react-hono-template

## 技术栈与架构入口

- React 19 SPA 模板，使用 TypeScript 6、Vite、Tailwind CSS 4、Ant Design、TanStack Router、TanStack Query、Zustand、Hono RPC 和 Zod。
- `src/main.tsx` 挂载 React 应用。
- `src/app.tsx` 组装 Ant Design、TanStack Query 和 TanStack Router provider。
- `src/routes/index.tsx` 定义路由树。
- `src/api/client.ts` 创建 Hono RPC client。

## 关键模块

- `src/routes/index.tsx`：真实路由定义，当前包含 `/` 和 `/about`。
- `src/pages/index.tsx`：根布局。
- `src/pages/home-page/`：首页业务区块。
- `src/pages/about-page/`：about 页面。
- `src/api/client.ts`：Hono RPC client，默认连接 `http://localhost:8080`。
- `src/api/posts.ts`：posts API 封装，负责请求/响应 schema 校验。
- `src/hooks/use-posts.ts`：TanStack Query hook，封装 posts 查询。
- `src/stores/`：Zustand 状态。

## 路由

- `/` 渲染 `HomePage`。
- `/about` 渲染 `AboutPage`。
- 根布局来自 `src/pages/index.tsx`，路由树在 `src/routes/index.tsx` 中挂载。

## 依赖关系

- 依赖 workspace 后端 `@kxh-awesome/hono-template`。
- 前端通过 `@kxh-awesome/hono-template/rpc` 的 `hcWithType` 创建 Hono RPC 客户端。
- `tsconfig.json` references 指向 `../hono-template/tsconfig.build.json`，后端 RPC 类型变更后应先验证后端构建。

## 项目命令

- `vp run dev`：启动前端开发服务器。
- `vp run build`：执行 `tsc -b && vp build`。
- `vp run preview`：预览构建产物。
- `vp run check`：运行 Vite+ 检查。

## 生成物

- `dist/`、`node_modules/` 和 `*.tsbuildinfo` 不手动编辑。

## 验证方式

- 普通前端改动运行 `vp run build`。
- 改 RPC 调用、schema 或后端导出类型时，先在 `templates/hono-template` 运行 `vp run build`，再回到本项目运行 `vp run build`。
- 涉及服务联动时，同时启动 Hono 后端和本前端做浏览器验证。
