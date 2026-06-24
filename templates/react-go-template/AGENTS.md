# react-go-template

## 技术栈与架构入口

- React 19 SPA 模板，使用 TypeScript 6、Vite、Tailwind CSS 4、Ant Design、TanStack Router、TanStack Query、Zustand、ConnectRPC 和 Connect Query。
- `src/main.tsx` 挂载 React 应用。
- `src/app.tsx` 组装 Ant Design、Connect Query transport、TanStack Query 和 TanStack Router provider，并配置默认后端地址。
- `src/routes/index.tsx` 定义路由树。
- `src/api/gen/go-template/` 提供 Connect Query descriptor 和 ConnectRPC 类型。
- `connectrpc.config.json` 维护后端 IDL 地址到前端生成目录的映射。
- `scripts/gen-rpc-client.mjs` 根据配置生成所有后端 RPC client。

## 关键模块

- `src/routes/index.tsx`：真实路由定义，当前包含 `/` 和 `/about`。
- `src/pages/index.tsx`：根布局。
- `src/pages/home-page/`：首页业务区块。
- `src/pages/about-page/`：about 页面。
- `src/api/gen/go-template/`：ConnectRPC TypeScript API 客户端，只读。
- `src/hooks/use-posts.ts`：Connect Query hook，封装 posts 查询。
- `src/stores/`：Zustand 状态。
- `connectrpc.config.json`：后端 IDL 配置，`idl` 可指向本地 Buf module 或 BSR schema。

## 路由

- `/` 渲染 `HomePage`。
- `/about` 渲染 `AboutPage`。
- 根布局来自 `src/pages/index.tsx`，路由树在 `src/routes/index.tsx` 中挂载。

## 依赖关系

- 依赖 `templates/go-template` 提供的 ConnectRPC 服务。
- 不通过 workspace import 后端 Go 代码，接口契约来自 proto 生成产物。

## 项目命令

- `vp run dev`：启动前端开发服务器。
- `vp run gen`：根据 `connectrpc.config.json` 生成全部后端 RPC client。
- `vp run build`：执行 `tsc -b && vp build`。
- `vp run preview`：预览构建产物。
- `vp run check`：运行 Vite+ 检查。

## 生成物

- `dist/`、`node_modules/`、`*.tsbuildinfo` 和 `src/api/gen/go-template/` 不手动编辑。

## 验证方式

- 普通前端改动运行 `vp run build`。
- 后端 proto 变化后，先在 `templates/go-template` 运行 `./generate.sh`，再运行 `vp run gen`，最后运行 `vp run build`。
- 涉及服务联动时，同时启动 Go 后端和本前端做浏览器验证。
