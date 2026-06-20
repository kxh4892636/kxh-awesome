# react-go-template

## 技术栈与架构入口

- React 19 SPA 模板，使用 TypeScript 6、Vite、Tailwind CSS 4、shadcn/ui、TanStack Router、TanStack Query、Zustand 和 ConnectRPC。
- `src/main.tsx` 挂载 React 应用。
- `src/app.tsx` 组装 TanStack Query 和 TanStack Router provider。
- `src/routes/index.tsx` 定义路由树和根布局。
- `src/api/client.ts` 创建 ConnectRPC transport 和 `PostsService` client。

## 关键模块

- `src/routes/index.tsx`：真实路由定义，当前包含 `/` 和 `/about`。
- `src/pages/home-page/`：首页业务区块。
- `src/pages/about-page.tsx`：about 页面。
- `src/api/client.ts`：ConnectRPC client 配置，默认连接 `http://localhost:8080`。
- `src/api/gen/go-template/`：由 `connectrpc-gen` 生成的 TypeScript API 客户端，只读。
- `src/hooks/use-posts.ts`：TanStack Query hook，封装 `postsClient.getPosts`。
- `src/components/ui/`：shadcn/ui 组件源码。
- `src/stores/`：Zustand 状态。

## 路由

- `/` 渲染 `HomePage`。
- `/about` 渲染 `AboutPage`。
- 根布局在 `src/routes/index.tsx` 内定义，包含顶部导航和 `Outlet`。

## 依赖关系

- 依赖 `templates/go-template` 提供的 ConnectRPC 服务。
- 依赖 workspace package `@kxh-awesome/connectrpc-gen` 生成 `src/api/gen/go-template/`。
- 不通过 workspace import 后端 Go 代码，接口契约来自 proto 生成产物。

## 项目命令

- `vp run dev`：启动前端开发服务器。
- `vp run build`：执行 `tsc && vp build`。
- `vp run preview`：预览构建产物。
- `vp run gen:api go-template`：从 `templates/go-template/proto` 生成前端 API 代码。

## 生成物

- `dist/`、`node_modules/` 和 `src/api/gen/go-template/` 不手动编辑。

## 验证方式

- 普通前端改动运行 `vp run build`。
- 后端 proto 变化后，先在 `templates/go-template` 运行 `./generate.sh`，再运行 `vp run gen:api go-template`，最后运行 `vp run build`。
- 涉及服务联动时，同时启动 Go 后端和本前端做浏览器验证。
