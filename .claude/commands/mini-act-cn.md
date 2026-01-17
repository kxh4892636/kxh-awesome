---
description: 实现已批准的 OpenSpec 变更并保持任务同步。
argument-hint: change-id
---

<!-- OPENSPEC:START -->

**防护原则**

- 优先采用直接、最小化的实现，仅在请求或明确需要时才增加复杂度。
- 将变更范围严格限制在请求的结果之内。
- 如需额外的 OpenSpec 约定或说明，请参考 `openspec/AGENTS.md`（位于 `openspec/` 目录内——如果看不到该文件，请运行 `ls openspec` 或 `openspec update`）。

**步骤**
将这些步骤记录为 TODO 并逐一完成。

1. 阅读 `changes/<id>/proposal.md`、`design.md`（如果存在）和 `tasks.md` 以确认范围和验收标准。
2. 按顺序处理任务，保持编辑最小化并专注于请求的变更。
3. 在更新状态之前确认完成——确保 `tasks.md` 中的每个项目都已完成。
4. 在所有工作完成后更新检查清单，使每个任务标记为 `- [x]` 并反映实际情况。
5. 需要额外上下文时，参考 `openspec list` 或 `openspec show <item>`。

**参考**

- 如果在实现过程中需要从提案中获取额外上下文，请使用 `openspec show <id> --json --deltas-only`。

$ARGUMENTS

<!-- OPENSPEC:END -->



---
description: 创建包含细分任务的详细实现计划
disable-model-invocation: true
---

调用 superpowers:writing-plans 技能并完全按照展示给你的方式执行
