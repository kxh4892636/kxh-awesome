# kxh-kit

## 技术栈与架构入口

- Codex plugin，不是标准 Node workspace package。
- `.codex-plugin/plugin.json` 是插件 manifest，声明 skills、MCP、界面信息和能力。
- `skills/` 下的 `SKILL.md` 文件是 Codex 可触发能力入口。
- `hooks/hooks.json` 注册 SessionStart hook，当前通过 Node 执行 `hooks/session_start.js`。

## 关键模块

- `.codex-plugin/plugin.json`：插件名称、版本、skills/MCP 目录和界面元信息。
- `.mcp.json`：插件内 Anki 与 Chrome DevTools MCP server 配置。
- `skills/grilling/SKILL.md`：计划或设计的逐问追问规则。
- `skills/handoff/SKILL.md`：交接文档创建、更新、TaskList 状态维护规则。
- `hooks/hooks.json`：startup/compact 的 hook 注册。
- `hooks/session_start.js`：注入 session id、handoff 路径和 compact 上下文。

## 项目命令

- 本目录没有 `package.json`，不要硬套 `vp`。
- 可用 `node hooks/session_start.js` 并传入 SessionStart JSON payload 验证输出结构。

## 生成物

- 插件缓存目录不在本目录内维护。
- `docs/handoff/*.md` 是插件使用方仓库中的交接文档，不属于本插件源码。

## 验证方式

- 改 `plugin.json`、`.mcp.json` 或 `hooks.json` 后用 JSON 解析验证格式。
- 改 hook 脚本后至少运行对应 Node 命令的最小验证。
- 改 skill 文案后人工检查触发条件、路径规则、TaskList 状态枚举和自动更新要求是否一致。
