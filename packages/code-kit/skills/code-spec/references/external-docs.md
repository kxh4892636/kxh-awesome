# External Docs

读取本文件处理第三方依赖 API 查询和官方文档入口。优先搜索项目内现有用法；只有 API 不确定、版本差异可能影响实现、或用户明确要求查证时才读取外部官方文档。

| 依赖 | 官方文档 |
|------|----------|
| React | https://react.dev/ |
| TypeScript | https://www.typescriptlang.org/docs/ |
| Tailwind CSS | https://tailwindcss.com/docs |
| Ant Design / antd | 先看 `references/antd/README.md` 和本地中文官方文档快照，再查 https://ant.design/components/overview-cn/ |
| Zustand | https://zustand.docs.pmnd.rs/ |
| Zod | 先看 `references/zod/README.md` 和本地 docs 快照，再查 https://zod.dev/ |
| @tanstack/react-query | 先看 `references/react-query/README.md` 和本地 React docs 快照，再查 https://tanstack.com/query/latest/docs |
| @tanstack/react-router | https://tanstack.com/router/latest/docs |
| dayjs | https://day.js.org/ |
| es-toolkit | https://es-toolkit.slash.page/ |
| ahooks | https://ahooks.js.org/ |
| @arco-design/mobile-react | https://arco.design/mobile/react |
| Vite | https://vite.dev/ |
| Vitest | https://vitest.dev/ |
| Vite+ (vp) | 先看 `references/vite-plus/README.md`，再查 `node_modules/vite-plus/docs` 或 https://viteplus.dev/guide/ |
| Docusaurus | https://docusaurus.io/docs |
| ConnectRPC | https://connectrpc.com/docs/web/getting-started |
| @connectrpc/connect | https://www.npmjs.com/package/@connectrpc/connect |
| @bufbuild/protobuf | https://buf.build/docs/protobuf-es |

## 内部依赖

以下依赖无公开文档，遇到问题时搜索项目内现有用法作为参考：

- `@ecom/auxo`
- `@ecom/auxo-mobile`
- `@ecom/auxo-pro-table`
- `@ecom/auxo-pro-form`
- BAM
