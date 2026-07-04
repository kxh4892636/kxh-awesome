# plugin-wiki-kit

## 技术栈与架构入口

- Codex plugin，不是标准 Node workspace package。
- `.codex-plugin/plugin.json` 是插件 manifest，声明 skills 和界面元信息。
- `skills/` 下的 `SKILL.md` 文件是 Codex 可触发能力入口。

## 关键模块

- `.codex-plugin/plugin.json`：插件名称、版本、skills 目录和界面元信息。
- `skills/note-creator/SKILL.md`：技术笔记创建与优化规则。
- `skills/to-anki/SKILL.md`：Anki 卡片创建任务分流规则。
- `skills/wiki-kit-update/SKILL.md`：plugin-wiki-kit 内远程来源 skill 的更新登记。

## 验证方式

- 改 `plugin.json` 后用 JSON 解析验证格式。
- 改 skill 文案后人工检查触发条件、reference 路由和目标输出格式是否一致。
