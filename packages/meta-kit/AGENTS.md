# meta-kit

## 技术栈与架构入口

- Codex plugin，不是标准 Node workspace package。
- `.codex-plugin/plugin.json` 是插件 manifest，声明 skills 和界面元信息。
- `skills/` 下的 `SKILL.md` 文件是 Codex 可触发能力入口。
- `hooks/hooks.json` 注册 SessionStart hook，通过 Node 执行 `hooks/session_start.js`。

## 关键模块

- `.codex-plugin/plugin.json`：插件名称、版本、skills 目录和界面元信息。
- `hooks/hooks.json`：startup/compact 的 hook 注册。
- `hooks/session_start.js`：注入 session id、handoff 路径和 compact 上下文。
- `skills/grilling/SKILL.md`：计划或设计的逐问追问规则。
- `skills/handoff/SKILL.md`：交接文档创建、更新和 TaskList 状态维护规则。
- `skills/meta-kit-update/SKILL.md`：meta-kit 内远程来源 skill 的更新登记。

## 验证方式

- 改 `plugin.json` 或 `hooks.json` 后用 JSON 解析验证格式。
- 改 hook 脚本后至少运行对应 Node 命令的最小验证。
- 改 skill 文案后人工检查触发条件、路径规则和状态枚举是否一致。
