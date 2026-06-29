# code-kit

## 技术栈与架构入口

- Codex plugin，不是标准 Node workspace package。
- `.codex-plugin/plugin.json` 是插件 manifest，声明 skills 和界面元信息。
- `skills/` 下的 `SKILL.md` 文件是 Codex 可触发能力入口。

## 关键模块

- `.codex-plugin/plugin.json`：插件名称、版本、skills 目录和界面元信息。
- `skills/agent-browser/SKILL.md`：agent-browser CLI 的浏览器自动化入口。
- `skills/code-spec/SKILL.md`：全栈代码规范与专项开发指南。
- `skills/diagnosing-bugs/SKILL.md`：诊断复杂 bug 和性能退化的流程。
- `skills/lark-doc-quality/SKILL.md`：Lark 文档和画板质量规范。
- `skills/code-kit-update/SKILL.md`：code-kit 内远程来源 skill 与 reference 模块的更新登记。

## 验证方式

- 改 `plugin.json` 后用 JSON 解析验证格式。
- 改 skill 文案后人工检查触发条件、reference 路由和渐进披露规则是否一致。
- 改 reference 脚本后只运行相关最小验证。
