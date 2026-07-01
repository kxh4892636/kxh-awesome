---
name: wiki-kit-update
description: 维护 plugin-wiki-kit 内远程来源 skill 的登记与更新流程。触发场景：更新或检查 plugin-wiki-kit skill、查看远程来源、添加/删除登记项。关键词：wiki-kit update、plugin-wiki-kit update、remote skill、Git source、skill registry。
---

# wiki-kit-update

使用本 skill 让 plugin-wiki-kit 内有远程来源的 skills 保持可复现。当前没有已登记的远程来源；只有用户明确提供来源并要求登记时才新增条目。

## 操作流程

1. 确认目标 skill，并读取下方对应的登记项。
2. 如果目标 skill 不在登记表中，先说明当前没有远程来源登记；不要凭空推断来源。
3. 修改前先检查当前本地 skill 目录。
4. 将远程来源获取到临时目录。优先使用浅克隆；对子目录使用 sparse checkout；更新后删除临时目录。
5. 更新前先比较获取到的远程 skill 内容与本地 skill。如果没有有意义的差异，就停止并报告本地 skill 已是最新。
6. 只有在比较发现差异时，才应用登记的更新方式。不要盲目覆盖本地变更；先比较来源与目标。
7. 保留登记项中标明的本地 overlay。
8. 至少检查 `SKILL.md` frontmatter、必需文件和变更文件 diff。
9. 总结已变更文件、已跳过文件、验证状态，以及任何需要跟进的事项。

## 新登记项

只有当用户明确要求把某个新 skill 加入 plugin-wiki-kit 远程来源登记表时，才新增登记项。新增时记录：

- `skill-name`
- 本地 skill 路径
- 远程来源 URL 或 Git 仓库 URL
- 来源子目录，如有
- 更新方式
- 本地 overlay 或更新后步骤，如有

## 远程 Skill 登记表

| skill-name | 远程来源 | 本地路径 | 更新方式 |
| --- | --- | --- | --- |
