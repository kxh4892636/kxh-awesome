---
name: loop-dev
description: 串联 plugin-loop-kit 的需求、讨论、文档、计划、TDD/BDD、验证和复盘流程。
disable-model-invocation: true
---

# Loop Dev

用户手动触发的开发流程入口。它只负责把 `plugin-loop-kit` 中的 skill 编排成一条从需求到交付的路径，不复述各 skill 的内部实现。

A **flow** is a path through the skills. Most product and engineering work follows the main flow, while bugs, architecture work, documents, and browser checks enter through branches or on-ramps.

## The main flow: idea → ship

需求 -> 讨论 -> 计划 -> TDD/BDD (测试 -> 开发 -> 验收 -> 重复) -> 整体验收

1. **定义需求** — 明确目标、交付产物、验收标准和不做范围。区分已验证事实与未验证假设；如果问题本身是 bug、性能回归或间歇失败，转入“Bug on-ramp”。
2. **讨论对齐** — 使用 `grilling` 逐个问题确认需求，不一次抛出多个问题。能从代码库或资料中查到的问题先自行探索，不向用户索要。完成条件是关键目标、约束、验收口径和风险已经逐项确认。
3. **Branch — 是否需要文档产物？**
   - 需求范围、用户故事、验收口径不清晰 → 使用 `to-prd` 生成 PRD。
   - 前端实现涉及数据源、模块拆分、交互逻辑、埋点或联调方案 → 使用 `to-tech` 生成前端技术文档。
   - 涉及飞书/Lark 文档、画板或富文本同步 → 使用 `lark-doc-quality`，必要时按其画板质量门生成或更新画板。
   - 影响面单一、验收路径明确 → 跳过文档分支，直接进入计划。
4. **计划切片** — 给出实现路径、垂直切片、每个切片的验证方式和回退点。改动大、跨模块、多会话、验收链路复杂或需要交接上下文时，使用 `to-plan` 创建或更新计划文档；小需求保留在当前上下文内计划即可。
5. **确认门禁** — 计划阶段结束后必须等待用户确认，禁止自动进入开发。确认内容包括流程选择、文档分支、切片顺序、验证方式、是否需要 `to-plan`。
6. **选择开发循环** — 前端页面、组件、交互、表单、路由、接口消费、权限态、空态、错误态或 E2E 开发使用 `bdd`；后端、库、CLI、纯逻辑、接口行为和通用回归测试使用 `tdd`。
7. **垂直切片执行** — 每个切片只处理一个可验收行为：
   - BDD：Scenario → Red → Green → Refactor → Regress。
   - TDD：Red → Green → Refactor。
   - 每个切片完成后使用 `verify` 做最小但可信的验收。
   - 如果使用了 `to-plan`，切片状态变化后立即同步状态、验证结果、风险和阻塞。
8. **整体验收** — 所有切片完成后，使用 `verify` 汇总影响范围和验收矩阵，执行最小可信的静态检查、测试、构建、运行时、接口或浏览器验收。
9. **复盘分支** — 若开发或验收暴露出 shallow module、没有好 seam、测试难以落地或重复修复成本高，提出进入 `improve-codebase-architecture`；不要把架构大改混入当前交付，除非用户重新确认范围。

### Context hygiene

需求、讨论、计划必须留在同一个上下文中完成，避免丢失用户约束。多会话或跨模块任务使用 `to-plan` 作为交接事实源；每个新会话从计划文档恢复目标、切片状态、验证结果、阻塞项和引用资源。

小需求不强制创建计划文档。只要当前上下文足够承载目标、范围、切片和验证事实，就在当前线程内完成。

## Bug on-ramp

Something is broken, throwing, slow, flaky, or regressed.

1. 使用 `diagnosing-bugs` 建立 tight feedback loop：必须先有一个能红在当前 bug 上的命令、脚本、测试、浏览器脚本或可重复复现路径。
2. 复现并最小化失败场景，生成可证伪假设，再用一次一个变量的方式验证。
3. 在正确 seam 上写回归测试；没有正确 seam 时，把“无法锁定回归”的事实记录为架构风险。
4. 修复后使用 `verify` 重跑原始复现和回归测试。
5. 如果根因是没有好 seam、模块 shallow 或测试面错误，建议进入 `improve-codebase-architecture`。

当 bug 修复演变成较大改造时，回到主线的“讨论 → 文档分支 → 计划 → TDD/BDD 切片”。

## Architecture on-ramp

用户要求架构优化、寻找重构机会、提升可测试性或提升 AI 可导航性时，直接使用 `improve-codebase-architecture`。

- 先探索相关代码和文档，按其 vocabulary 使用 module、interface、implementation、depth、deep、shallow、seam、adapter、leverage、locality。
- 先产出 HTML 候选报告，不直接改代码。
- 用户选择候选后进入 grilling loop；需要实现时，把候选转回主线，从讨论和计划开始。

## Browser support

`browser-use` 是支撑能力，不是独立主线。

- 前端 BDD、E2E、页面验收、截图检查、交互验证时按需使用。
- 页面问题复现、DOM/网络/控制台检查时，可由 `diagnosing-bugs` 或 `verify` 调用。
- 纯后端、CLI、库和文档任务不默认使用。

## Code rules underneath

代码实现阶段按任务类型调用 `code-spec`：

- JavaScript/TypeScript、命名、函数、模块、注释、错误处理 → 读取 common rules。
- React/Vue 页面、组件、样式、组件库 → 读取 frontend rules，并按需读取 React、Ant Design 或 React Query 参考。
- 请求函数、hook、接口消费 → 读取 HTTP request rules。
- Go 后端、RPC、service/use case、repository、数据库或后台任务 → 读取 backend rules。
- Vite+/vp、依赖、构建、检查、测试或 workspace 命令 → 读取 Vite+ 参考，并使用项目约定工具链。

`code-spec` 只提供实现规范，不替代 BDD/TDD、verify 或项目自身规则。

## Standalone entries

- **`grilling`** — 单独用于计划、设计或方案压力测试；一次只问一个问题，并给推荐答案。
- **`to-prd`** — 从当前对话合成 PRD，不采访用户。
- **`to-tech`** — 从当前对话和代码库事实生成前端技术文档，不采访用户。
- **`lark-doc-quality`** — 处理飞书/Lark 文档质量、富文本结构和画板质量门。
- **`to-plan`** — 只在大改、跨模块、多会话、验收链路复杂或需要交接上下文时创建或更新计划文档。
- **`verify`** — 单独用于验收、回归、冒烟、联调、发布前检查或代码修改后的闭环验证。

## 垂直切片开发约束

- 禁止一次撰写所有测试或者撰写所有实现，这是水平切片方式，导致低质量测试/验收；
- 将开发流程划分为若干垂直切片，每个切片完成（测试 -> 开发 -> 验收）或者（开发 -> 测试 -> 验收），验收通过后进行下一个垂直切片；
- 每个切片基于上一循环的事实，对当前切片进行修正；
- 如果一组 skill 包含计划、状态同步或上下文文档 skill，每个垂直切片状态变化后立即同步状态，不得允许全部开发完成后再统一同步。

```
<!-- 以 TDD/BDD 开发流程为例 -->

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
