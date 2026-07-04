# react-go-template

React + Ant Design + ConnectRPC + Connect Query 前端模板，按 `app/pages/features/libs/common` 分层组织。

## 功能模块

- `live-clock`：`dayjs` 实时时钟。
- `counter`：`Zustand` 计数器，使用 `es-toolkit` 保持 `0..10` 范围。
- `posts`：`TanStack Query` + Connect Query 文章列表、刷新和错误态。
- `tech-stack`：About 页面技术栈展示。

## 目录

```txt
src/
├── app/        # 启动、Provider、路由、配置
├── pages/      # 页面组合
├── features/   # 用户可感知功能模块
├── libs/       # API、SDK、生成客户端等外部服务边界
└── common/     # 应用通用布局、样式和工具
```

接口请求使用 Connect Query，并通过 `src/libs/api/gen/go-template/` 中的 query descriptor 调用后端服务。`usePosts` 封装在 `src/libs/api/posts.ts`，页面功能从 `features/posts` 消费。

## 命令

```bash
vp install
vp run gen
vp run dev
```

默认后端地址为 `http://localhost:8080`，可通过 `VITE_API_BASE_URL` 覆盖。

`connectrpc.config.json` 维护后端 IDL 映射，`vp run gen` 会为配置里的所有后端生成 RPC client。

## BDD

前端 BDD 用 Markdown 维护在各 feature 的 `test/` 目录，验收执行走真实浏览器路径。稳定回归流程只在本次需求验收通过后合并到 `test/index.md`。
