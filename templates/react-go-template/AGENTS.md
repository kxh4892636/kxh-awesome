# react-go-template

## 技术栈与架构入口

- React 19 SPA 模板，使用 TypeScript 6、Vite、Tailwind CSS 4、Ant Design、TanStack Router、TanStack Query、Zustand、ConnectRPC 和 Connect Query。
- `src/app/main.tsx` 挂载 React 应用。
- `src/app/providers.tsx` 组装 Ant Design、Connect Query transport、TanStack Query 和 TanStack Router provider。
- `src/app/router.tsx` 注册路由树。
- `src/app/config.ts` 和 `src/app/env.ts` 读取应用配置，默认后端地址为 `http://localhost:8080`。
- `src/libs/api/gen/go-template/` 提供 Connect Query descriptor 和 ConnectRPC 类型。
- `connectrpc.config.json` 维护后端 IDL 地址到前端生成目录的映射。
- `scripts/gen-rpc-client.mjs` 根据配置生成所有后端 RPC client。

## 分层边界

- `src/app/`：应用启动、Provider、路由和配置装配，不承载业务规则。
- `src/pages/`：页面级组合，只编排 feature、common 和 libs。
- `src/features/`：用户可感知功能模块，当前包含 `live-clock`、`counter`、`posts`、`tech-stack`。
- `src/libs/`：外部服务交互封装，当前包含 ConnectRPC transport、posts API hook 和生成客户端。
- `src/common/`：端应用通用布局、样式和工具，不依赖 app、pages、features 或 libs。

## 关键模块

- `src/pages/home/`：首页组合 `live-clock`、`counter` 和 `posts`。
- `src/pages/about/`：About 页面组合 `tech-stack`。
- `src/features/live-clock/`：dayjs 当前时间展示。
- `src/features/counter/`：Zustand counter 和 `0..10` 计数规则。
- `src/features/posts/`：posts 列表、刷新、加载态和错误态。
- `src/features/tech-stack/`：模板技术栈展示。
- `src/libs/api/posts.ts`：Connect Query `usePosts` hook。
- `src/libs/api/gen/go-template/`：ConnectRPC TypeScript API 客户端，只读。

## BDD

- 前端 BDD 使用 Markdown 维护，真实浏览器 E2E 执行。
- 每个 feature 在自己的 `test/` 目录维护验收流程。
- 本次需求文档使用 `test/2026-07-05-architecture-rewrite.md`。
- `test/index.md` 只合并已经通过真实浏览器验收的稳定回归流程。

## 路由

- `/` 渲染 `HomePage`。
- `/about` 渲染 `AboutPage`。
- 根布局来自 `src/pages/root-layout/`，路由树在 `src/app/router.tsx` 中挂载。

## 依赖关系

- 依赖 `templates/go-template` 提供的 ConnectRPC 服务。
- 不通过 workspace import 后端 Go 代码，接口契约来自 proto 生成产物。
- `features/posts` 消费 `src/libs/api/posts.ts`，不直接导入生成客户端。

## 项目命令

- `vp run dev`：启动前端开发服务器。
- `vp run gen`：根据 `connectrpc.config.json` 生成全部后端 RPC client。
- `vp run build`：执行 `tsc -b && vp build`。
- `vp run preview`：预览构建产物。
- `vp run check`：运行 Vite+ 检查。

## 生成物

- `dist/`、`node_modules/`、`*.tsbuildinfo` 和 `src/libs/api/gen/go-template/` 不手动编辑。

## 验证方式

- 普通前端改动运行 `vp run build`。
- 后端 proto 变化后，先在 `templates/go-template` 运行 `./generate.sh`，再运行 `vp run gen`，最后运行 `vp run build`。
- 涉及服务联动时，同时启动 Go 后端和本前端做浏览器验证。
- 架构、feature 或交互变更按对应 `src/features/*/test/*.md` 执行真实浏览器验收。
