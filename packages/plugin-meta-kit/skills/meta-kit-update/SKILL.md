---
name: meta-kit-update
description: 维护 plugin-meta-kit 内远程来源 skill 的登记与更新流程。触发场景：更新或检查 plugin-meta-kit skill、查看远程来源、添加/删除登记项。关键词：meta-kit update、plugin-meta-kit update、remote skill、Git source、skill registry。
---

# meta-kit-update

使用本 skill 让 plugin-meta-kit 内有远程来源的 skills 保持可复现。它记录每个 skill 的名称、远程来源、本地路径、预期更新方式和本地 overlay。

## 操作流程

1. 确认目标 skill，并读取下方对应的登记项。
2. 修改前先检查当前本地 skill 目录。
3. 将远程来源获取到临时目录。优先使用浅克隆；对子目录使用 sparse checkout；更新后删除临时目录。
4. 更新前先比较获取到的远程 skill 内容与本地 skill。如果没有有意义的差异，就停止并报告本地 skill 已是最新。
5. 只有在比较发现差异时，才应用登记的更新方式。不要盲目覆盖本地变更；先比较来源与目标。
6. 保留登记项中标明的本地 overlay。
7. 当运行环境有兼容的 Python 环境时，使用可用的 `skill-creator` validator 验证更新后的 skill。否则，至少检查 `SKILL.md` frontmatter、必需文件和变更文件 diff。
8. 总结已变更文件、已跳过文件、验证状态，以及任何需要跟进的事项。

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
| `skill-creator` | `https://github.com/anthropics/skills/tree/main/skills/skill-creator` | `packages/plugin-meta-kit/skills/skill-creator` | 使用 sparse checkout 克隆 `https://github.com/anthropics/skills` 的 `skills/skill-creator`，然后在审阅 diff 后将该子目录同步到本地路径。保留本地 eval、validator 和 meta-kit 适配说明；不要求创建新 skill 后自动调用 update skill。 |

## 更新方式细节

### 一致性检查

获取远程来源后，在复制或重新生成任何内容前，先比较来源 skill 目录与本地 skill 目录。

```bash
diff -qr <remote-skill-dir> <local-skill-dir>
```

如果排除已知的仅本地文件后，`diff` 报告没有差异，就不要更新本地 skill。报告本地与远程 skill 已经一致。

### GitHub 子目录

适用于存放在较大仓库内部的 skills，例如 `skill-creator`。

```bash
git clone --depth 1 --filter=blob:none --sparse <repo-url> <tmp-dir>
cd <tmp-dir>
git sparse-checkout set <source-subdirectory>
# 检查 <source-subdirectory>，将其与本地 skill 比较，然后有意识地同步。
```

只有在确认来源布局与目标 skill 匹配后，才优先考虑 `rsync --delete`。排除仅本地文件，不复制 secrets 或生成输出。
