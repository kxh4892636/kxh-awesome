# connectrpc-gen

## 技术栈与架构入口

- TypeScript CLI package，bin 名称为 `connectrpc-gen`。
- `src/index.ts` 是唯一 CLI 入口。
- `package.json#bin` 指向 `dist/index.mjs`，构建由 Vite+ package 能力输出。

## 关键模块

- `src/index.ts#findRepoRoot`：向上查找包含 `connectrpc.config.json` 的仓库根目录。
- `connectrpc.config.json`：仓库级项目映射，CLI 根据项目名定位后端 proto 项目。
- `src/index.ts#main`：解析参数、读取配置、检查 `proto/`、生成临时 buf 配置并调用 `buf generate`。
- `src/index.ts` 中的 `outputDir` 固定为调用方 `src/api/gen/<project-name>`。
- `package.json#bin` 和 `package.json#scripts` 是 CLI 对外行为边界。

## 项目命令

- `vp run build`：构建 CLI。
- `vp run dev`：watch 构建。
- `vp run check`：运行 Vite+ 检查。
- `vp run prepare`：构建 package。

## 生成物

- `dist/` 和 `node_modules/` 不手动编辑。
- CLI 生成的调用方 `src/api/gen/<project-name>/` 是生成物，不手写。

## 验证方式

- 改 CLI 逻辑后运行 `vp run build`。
- 改类型或格式后运行 `vp run check`。
- 生成链路变更时，在 `templates/react-go-template` 运行 `vp run gen:api go-template` 做集成验证。
