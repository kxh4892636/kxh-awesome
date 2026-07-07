---
name: loop-dev
description: 串联需求、讨论、验收文档、计划、垂直切片开发、验证和审查的开发流程路由 skill。
disable-model-invocation: true
---

# Loop Dev

你不需要记住每个 loop skill，先走这个路由。

Loop Dev 只负责编排和路由 skill，不替代各 skill 的内部规则。进入某个阶段后，按对应 skill 的 `SKILL.md` 和它按场景披露的 reference 执行。

## The main flow: idea -> ship

大多数开发需求沿这条主流程推进。目标是把一个想法变成经过验收和审查的可交付变更。

1. **需求入口**：先识别用户目标、交付物、验收标准、不做范围和约束。事实问题从仓库、文档、配置和用户材料里查证；决策问题留给用户。
2. **讨论阶段 -> `grilling`**：逐个问题追问，直到需求、边界、关键取舍和分支条件达成共识。一次只问一个问题，并给出推荐答案。讨论阶段不得直接进入实现。
3. **文档分支**：根据产出需要选择文档 skill。
   - 需要正式产品需求文档 -> `to-prd`。
   - 需要前端技术文档 -> `to-tech`。
   - 需要飞书/Lark 文档、Wiki、会议纪要、技术方案、画板或富文本质量控制 -> `lark-doc-quality`，并与具体 Lark 读写 skill 配合。
   - 需要维护仓库范围内的推荐 skill -> `agents-creator`。
4. **验收文档 -> `grilling` / `to-acceptance`**：为需求生成或更新中文 Gherkin 验收文档。每个场景必须是可独立验收的垂直行为结果，并有稳定场景 ID。不确定验收标准的场景，先用 `grilling` 确认，直到达成共识。
5. **计划 -> `to-plan`**：把验收场景映射到垂直 TaskList。跨模块、多会话、长周期、验收链路复杂，或需要状态同步的任务必须生成计划文档。计划阶段结束后必须等待用户确认，禁止自动进入下一阶段。
6. **Vertical slice loop: test -> develop -> verify -> review**
   - **测试流程 -> `e2e` / `tdd`**：前端切片维护 Markdown E2E 文档，把验收场景展开成用户旅程、浏览器步骤和证据要求；后端、库逻辑和公开接口切片走 TDD，先确认测试 seam，再写一个面向公开接口或业务契约的行为测试。
   - **代码规范 -> `code-spec`**：根据改动类型读取最小规范层级。JS/TS 通用规则、前端规则、HTTP 请求、Go 后端规则、Vite+/vp 等只在相关时加载。
   - **验收闭环 -> `verifying`**：执行最小可信验收，修复失败项，再做最小范围重验，并回写验收文档或计划文档状态。
   - **切片审查 -> `code-review`**：在每个高风险切片或用户要求 review 时，对固定点以来的 diff 做 Standards + Spec 双轴审查。
   - **状态同步 -> `to-plan`**：任一切片的任务状态、验证结果、阻塞、关键决策、commit 或 PR 发生变化后立即同步计划文档。
7. **整体审查 -> `code-review` + `verifying`**：所有切片完成后，先对整体 diff 做 Standards + Spec 审查，再按验收文档执行最终验收。审查和验收都通过后才算完成。

### Context hygiene

需求、讨论、验收文档和计划必须留在同一个上下文中完成，避免丢失用户约束和决策来源。

如果计划显示这是多轮、多 issue 或多会话开发：

- 在同一上下文中完成 `grilling`、`to-acceptance` 和 `to-plan`。
- 用计划文档作为跨会话单一事实源；每个新会话只领取一个垂直切片或一个独立 issue。
- 每个会话开始先读取计划文档、验收文档和当前切片相关资源；不要依赖旧会话记忆。
- 每个切片状态变化后立即回写 `to-plan`；验收状态变化后回写 `to-acceptance` 或对应 E2E 文档。

## On-ramps

起点不同，但最终要并入主流程。

- **Something is broken** -> `diagnosing-bugs`。当用户说 debug、diagnose、报错、失败、变慢或回归时，从反馈循环开始。修复后把回归场景接回 `to-acceptance`、`to-plan` 和 `verifying`。
- **Need acceptance or test evidence first** -> `to-acceptance` 或 `e2e`。已有需求但缺少可验收规格时，先补 Gherkin 场景，再进入计划和垂直切片。
- **Need to validate existing work** -> `verifying`。已有实现或 PR 时，先读取验收文档、计划、项目测试入口和当前 diff，生成验收矩阵并执行。
- **Need a review** -> `code-review`。用户要求 review、审查分支或 PR 时，固定比较点，分别检查 Standards 和 Spec。

## Standalone

这些 skill 不总是进入开发主流程，但可以独立触发。

- **`agents-creator`**：创建或更新 `AGENTS.md` 推荐技能区块，只修改推荐区块。
- **`browser-use`**：需要直接控制浏览器、截图、点击、采集页面状态或验收本地/线上页面时使用；前端 E2E 文档需要真实浏览器验收时，用它执行步骤、截图和采证。
- **`e2e`**：维护 Markdown E2E 文档和 agent 浏览器步骤；它创建测试资产，不创建 Playwright/Cypress 等测试代码。
- **`lark-doc-quality`**：需要飞书文档结构、富文本、表格、引用、画板和图文质量门时使用。
- **`loop-boot`**：需要把一组 skill 编排成新的流程 skill 时使用。

## Vocabulary underneath

这些 skill 是底层参考，在主流程里按场景加载，不要在多个阶段重复解释。

- **`code-spec`**：代码规范和工程约束。只读本次任务相关 reference；开发后按项目上下文做贴近影响面的验证。
- **`tdd`**：红绿循环和测试质量。强调公开 seam、行为测试、红先于绿、一个切片一个测试。
- **`verifying`**：测试/验收闭环。把验收场景映射到最小可信验证路径，执行、修复、重验、回写。
- **`code-review`**：双轴审查。Standards 和 Spec 分开审查，固定点对比 diff，不让一个轴掩盖另一个轴。
- **`grilling`**：讨论原语。事实自己查，决策逐个问，并在确认前不执行计划。

## Branch Rules

- 用户只要文档时，停在对应文档 skill；不要自动进入开发。
- 用户只要验证或审查时，从 `verifying` 或 `code-review` 独立入口开始；不要补造需求流程。
- 前端测试流程为维护 E2E 文档：`to-acceptance` -> `e2e` -> `browser-use` -> `verifying`。
- 后端测试流程为 TDD：`to-acceptance` -> `tdd` -> `code-spec` -> `verifying`。
- 硬 bug 优先 `diagnosing-bugs`；没有 red-capable feedback loop 时不要先猜原因。
- 计划阶段结束后必须等待用户确认，才能进入测试和开发。

## 开发流程约束

开发流程：需求 -> 讨论 -> 验收文档 -> 计划 -> (测试 -> 开发 -> 切片审查 -> 重复) -> 整体审查

- 禁止一次撰写所有测试或者撰写所有实现，这是水平切片方式，导致低质量测试/开发；
- 划分为若干垂直切片，每个切片完成（测试 -> 开发 -> 切片审查 -> 重复），验收通过后进行下一个垂直切片，每个切片基于上一循环的事实，对当前切片进行修正。
- 审查包括代码审查和验收。
- 如果一组 skill 包含计划、状态同步或上下文文档 skill，每个垂直切片状态变化后立即同步状态，不得允许全部开发完成后再统一同步。
- **如果开发流程与业务 skill 相冲突，使用业务 skill 的规则。**

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5
  VERIFY: verify1, verify2, verify3, verify4, verify5

RIGHT (vertical):
  RED→GREEN: test1→impl1→verify1
  RED→GREEN: test2→impl2→verify2
  RED→GREEN: test3→impl3→verify3
  ...
```
