---
description: 创建新的 OpenSpec 变更并进行严格验证。
argument-hint: 请求或功能描述
---

<!-- OPENSPEC:START -->

**防护原则**

- 优先采用直接、最小化的实现，仅在请求或明确需要时才增加复杂度。
- 将变更范围严格限制在请求的结果之内。
- 如需额外的 OpenSpec 约定或说明，请参考 `openspec/AGENTS.md`（位于 `openspec/` 目录内——如果看不到该文件，请运行 `ls openspec` 或 `openspec update`）。
- 识别任何模糊或不明确的细节，并在编辑文件之前提出必要的后续问题。
- 在提案阶段不要编写任何代码。仅创建设计文档（proposal.md、tasks.md、design.md 和规范增量）。实施在批准后的应用阶段进行。

**步骤**

1. 审查 `openspec/project.md`，运行 `openspec list` 和 `openspec list --specs`，并检查相关代码或文档（例如通过 `rg`/`ls`），以将提案建立在当前行为的基础上；记录任何需要澄清的差距。
2. 选择一个唯一的以动词开头的 `change-id`，并在 `openspec/changes/<id>/` 下搭建 `proposal.md`、`tasks.md` 和 `design.md`（需要时）。
3. 将变更映射到具体的功能或需求，将多范围的工作分解为具有明确关系和顺序的独立规范增量。
4. 当解决方案跨越多个系统、引入新模式或在提交规范之前需要权衡讨论时，在 `design.md` 中记录架构推理。
5. 使用 `## ADDED|MODIFIED|REMOVED Requirements` 在 `changes/<id>/specs/<capability>/spec.md`（每个功能一个文件夹）中起草规范增量，每个需求至少包含一个 `#### Scenario:`，并在相关时交叉引用相关功能。
6. 将 `tasks.md` 起草为有序的小型、可验证的工作项列表，提供用户可见的进度，包括验证（测试、工具），并突出依赖关系或可并行的工作。
7. 使用 `openspec validate <id> --strict` 验证并在共享提案之前解决每个问题。

**参考**

- 当验证失败时，使用 `openspec show <id> --json --deltas-only` 或 `openspec show <spec> --type spec` 检查详细信息。
- 在编写新需求之前，使用 `rg -n "Requirement:|Scenario:" openspec/specs` 搜索现有需求。
- 使用 `rg <keyword>`、`ls` 或直接文件读取探索代码库，使提案与当前实现现实保持一致。

$ARGUMENTS

## <!-- OPENSPEC:END -->

description: 创建包含细分任务的详细实现计划
disable-model-invocation: true

---

调用 superpowers:writing-plans 技能并完全按照展示给你的方式执行
