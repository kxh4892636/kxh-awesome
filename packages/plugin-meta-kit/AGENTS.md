# plugin-meta-kit

## 技术栈与架构入口

- Codex plugin，不是标准 Node workspace package。
- `.codex-plugin/plugin.json` 是插件 manifest，声明 skills 和界面元信息。
- `skills/` 下的 `SKILL.md` 文件是 Codex 可触发能力入口。

## 关键模块

- `.codex-plugin/plugin.json`：插件名称、版本、skills 目录和界面元信息。
- `skills/meta-kit-update/SKILL.md`：plugin-meta-kit 内远程来源 skill 的更新登记。
- `skills/skill-creator/SKILL.md`：创建、评估和优化 skill。
- `skills/skill-extractor/SKILL.md`：从 URL、文档或对话提取 skill。
- `skills/refine-me/SKILL.md`：基于上下文分析个人模式与改进方向。

## 验证方式

- 改 `plugin.json` 后用 JSON 解析验证格式。
- 改 skill 文案后人工检查触发条件、路径规则和状态枚举是否一致。
