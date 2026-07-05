---
name: meta-kit-update
description: 维护 plugin-meta-kit 内远程来源 skill 的登记与更新流程。触发场景：更新或检查 plugin-meta-kit skill、查看远程来源、添加/删除登记项。关键词：meta-kit update、plugin-meta-kit update、remote skill、Git source、skill registry。
---

# meta-kit-update

使用本 skill 让 plugin-meta-kit 内有远程来源的 skills 保持可复现。它记录每个 skill 的名称、远程来源、本地路径、预期更新方式和本地 overlay。当前未登记远程来源的本地 skills 不应被推断来源。

## 操作流程

1. 确认目标 skill，并读取下方对应的登记项。
2. 如果目标 skill 不在登记表中，先说明当前没有远程来源登记；不要凭空推断来源。
3. 修改前先检查当前本地 skill 目录。
4. 将远程来源获取到临时目录。优先使用浅克隆；对子目录使用 sparse checkout；更新后删除临时目录。
5. 更新前先比较获取到的远程 skill 内容与本地 skill。如果没有有意义的差异，就停止并报告本地 skill 已是最新。
6. 只有在比较发现差异时，才应用登记的更新方式。不要盲目覆盖本地变更；先比较来源与目标。
7. 保留登记项中标明的本地 overlay。
8. 如果目标 skill 自带 validator，使用其 validator 验证更新后的 skill。否则，至少检查 `SKILL.md` frontmatter、必需文件和变更文件 diff。
9. 总结已变更文件、已跳过文件、验证状态，以及任何需要跟进的事项。

## 新登记项

只有当用户明确要求把某个新 skill 加入 plugin-meta-kit 远程来源登记表时，才新增登记项。新增时记录：

- `skill-name`
- 本地 skill 路径
- 远程来源 URL 或 Git 仓库 URL
- 来源子目录，如有
- 更新方式
- 本地 overlay 或更新后步骤，如有

## 远程 Skill 登记表

| skill-name | 远程来源 | 本地路径 | 更新方式 |
| --- | --- | --- | --- |
| `teach` | `https://github.com/mattpocock/skills/tree/main/skills/productivity/teach` | `packages/plugin-meta-kit/skills/teach` | 使用 sparse checkout 克隆 `https://github.com/mattpocock/skills` 的 `skills/productivity/teach`，比较远程目录与本地目录后同步有意义变更。同步 `SKILL.md` 时保留同目录格式参考文件：`MISSION-FORMAT.md`、`RESOURCES-FORMAT.md`、`LEARNING-RECORD-FORMAT.md`、`GLOSSARY-FORMAT.md`。保留本地 overlay：删除上游 `disable-model-invocation: true` 和 `argument-hint` frontmatter 字段，因为当前 validator 不接受这些字段。 |
| `writing-great-skills` | `https://github.com/mattpocock/skills/tree/main/skills/productivity/writing-great-skills` | `packages/plugin-meta-kit/skills/writing-great-skills` | 使用 sparse checkout 克隆 `https://github.com/mattpocock/skills` 的 `skills/productivity/writing-great-skills`，比较远程目录与本地目录后同步有意义变更。同步 `SKILL.md` 时保留同目录 `GLOSSARY.md`，避免正文引用断链。保留本地 overlay：删除上游 `disable-model-invocation: true` frontmatter 字段，因为当前 validator 不接受该字段。 |

当前 `note-creator` 和 `to-anki` 没有已登记的远程来源；只有用户明确提供来源并要求登记时才新增条目。

## 更新方式细节

### 一致性检查

获取远程来源后，在复制或重新生成任何内容前，先比较来源 skill 目录与本地 skill 目录。

```bash
diff -qr <remote-skill-dir> <local-skill-dir>
```

如果排除已知的仅本地文件后，`diff` 报告没有差异，就不要更新本地 skill。报告本地与远程 skill 已经一致。

### GitHub 子目录

适用于存放在较大仓库内部的 skills，例如 `teach` 和 `writing-great-skills`。

```bash
git clone --depth 1 --filter=blob:none --sparse <repo-url> <tmp-dir>
cd <tmp-dir>
git sparse-checkout set <source-subdirectory>
# 检查 <source-subdirectory>，将其与本地 skill 比较，然后有意识地同步。
```

只有在确认来源布局与目标 skill 匹配后，才优先考虑 `rsync --delete`。排除仅本地文件，不复制 secrets 或生成输出。
