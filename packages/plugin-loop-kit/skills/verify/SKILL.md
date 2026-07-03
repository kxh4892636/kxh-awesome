---
name: verify
description: |
  电商治理前端交付验收 skill。凡是用户要求验证、验收、走查、联调、E2E、检查接口报错、根据 logId 排查后端、确认发布到 PPE、等待 BITS 流水线/PPE 部署完成，或完成代码修改后需要闭环验证时，优先使用本 skill。它统一编排 biome/emo build 静态检查、push 后 BITS 流水线守护、PPE 部署完成确认、Codex 自带 Chrome 插件浏览器 E2E、业务 E2E 流程、接口验证、Argos 后端排障。
---

# Verify

本 skill 是交付验收的统一入口。目标不是把所有检查都跑一遍，而是根据改动风险和用户目标选择最小但足够可信的验证闭环。

## 完成标准

一次验收完成时，应能回答：

1. 本次改动影响哪个 app、页面、路由、业务域和商家态。
2. `biome` 与 `emo build` 是否通过；未通过时已修复或明确阻塞。
3. 如果本轮 push 触发了 BITS 流水线，或用户提供 develop URL / pipeline ID，目标 PPE 是否已部署完成；未完成时是否已按 30 秒轮询、定位失败节点并处理。
4. 页面是否在真实浏览器中完成关键路径 E2E 验证；同一路径内的前端 UI 与后端接口是否同时符合预期。
5. 相关接口是否无网络错误，响应结构、核心业务数据和页面消费结果是否一致。
6. 如接口失败，是否已提取 `logId` 并通过 Argos 定位到后端问题；后端修复是否满足用户授权边界。
7. 失败项是否已修复并完成最小范围重验；已通过项无需重复验收。
8. 验证结论是否包含通过/失败/待确认、证据和下一步。

## 总流程

按顺序执行，除非用户明确要求跳过某一类验证：

1. **识别影响范围**：根据修改文件、app `AGENTS.md`、路由配置和业务上下文确定 workspace、页面 URL、业务域、端型和商家态需求。
2. **静态检查**：
   - `pnpm` 命令必须使用仓库声明的版本。先读取根 `package.json.packageManager`，优先执行 `corepack pnpm ...`；如果必须直接用 `pnpm`，先确认 `pnpm -v` 与仓库声明一致。不要使用 Codex runtime 或全局注入的错误 pnpm 版本得出验证结论。
   - `biome`：优先对本次变更文件执行 `corepack pnpm biome check <file...>`；文件很多或跨模块时执行 `corepack pnpm lint:changed`。
   - `emo build`：只 build 受影响 workspace，命令为 `emo build <workspace-name>`；`workspace-name` 从目标 app/package 的 `package.json.name` 获取。
   - 即使本地已有 `emo start <workspace-name>`，默认仍执行 `emo build <workspace-name>`，除非用户临时要求跳过。
3. **BITS / PPE 流水线守护**：如果本轮由 agent push 代码，或用户提供 BITS develop URL、dev-id、pipeline ID、要求等待 PPE / BOE 部署完成，读取 [pipeline-guard](reference/subskills/pipeline-guard/README.md)。默认守护 PPE；只有用户明确 BOE 时才切换 BOE。每 30 秒轮询，确认 PPE 部署完成后再进入浏览器验收。
4. **浏览器 E2E 验收**：读取 [e2e](reference/subskills/e2e/README.md)，在同一次用户路径中同时验证前端 UI 和后端接口；如果命中治理业务场景，再读取业务流程 reference。发现接口错误时读取 [backend-troubleshooting](reference/subskills/backend-troubleshooting/README.md)。
5. **报告结论**：结论前置，列出已验证项、证据、问题、阻塞和建议。

## 验收循环

验收是“检查 → 修复 → 最小重验”的循环，直到全部通过或出现明确阻塞。每轮都记录失败点、修复动作和重验结果。

1. **静态检查失败**：修改对应前端代码后，只重新执行失败的静态检查项。例如 `biome` 失败就先重跑对应文件的 `corepack pnpm biome check <file...>`；`emo build <workspace-name>` 失败就修复后重跑该 workspace build。已经通过的检查不重复执行，除非修复影响了它。若检查命令在进入 `biome` 前因 pnpm 版本、依赖状态检查或 lockfile 配置失败，先校正 pnpm 版本，不要把工具链版本问题误报为代码检查失败。
2. **E2E UI 失败**：修改对应前端代码后，只重新验收失败的页面路径、交互步骤和 UI 断言；已通过的商家态准备、无关页面和无关断言不重复。
3. **PPE 或其之前节点失败**：先读取失败 job 和 job-run 详情，判断是否由代码导致。若是 lint、build、test、类型检查、SCM 编译或产物构建等代码问题，修复后重新 push，并轮询新流水线。若是平台、权限、资源、人工审批、Goofy / SCM 临时错误或外部服务问题，先尝试允许的安全重试；不可重试或重试失败时标为阻塞 / 待确认。不要为了制造新 push 做无意义代码改动。
4. **E2E 接口失败**：提取 logId 并定位问题。若问题在前端请求参数、数据消费或状态处理，修复前端后重验该接口对应的 E2E 步骤。若问题在后端，按后端修复边界修改后端代码、提交 push、等待 PPE 发布完成，再重验该接口对应的 E2E 路径，同时确认 UI 和接口都已修复。
5. **重验范围控制**：只重验失败项及受修复影响的相邻项。不要为了一个失败接口重新跑全量 E2E；也不要因为一个静态检查失败重复执行已经通过的浏览器验收。
6. **停止条件**：所有失败项完成重验并通过；或缺少权限、数据、后端仓库、PPE 发布能力等导致无法继续，此时标为待确认/阻塞并说明缺口。

## 子流程路由

| 场景 | 读取 |
| --- | --- |
| push 后等待流水线、BITS develop URL、pipeline ID、确认 PPE/BOE 部署完成 | [pipeline-guard/README.md](reference/subskills/pipeline-guard/README.md) |
| 通用浏览器验收、页面验证、截图、交互、HMR、DevServer | [e2e/README.md](reference/subskills/e2e/README.md) |
| 体验分、奖惩、申诉、资金、举报、资质等治理业务 E2E | [e2e/README.md](reference/subskills/e2e/README.md) |
| E2E 中发现接口报错、logId、Argos、后端错误定位、PPE 发布状态 | [backend-troubleshooting/README.md](reference/subskills/backend-troubleshooting/README.md) |

只读取当前任务需要的子流程，避免把所有 reference 一次性加载进上下文。

## E2E 内的接口验证原则

前端 UI 验证和后端接口验证是同一个 E2E 操作的两面：沿真实用户路径操作页面时，一边断言页面状态、交互和渲染，一边断言该路径触发的接口请求和响应。不要把“看页面”和“查接口”拆成两个互相脱节的阶段。

1. 使用 Codex 自带 Chrome 插件的网络请求能力定位本次改动相关接口，例如请求列表与请求详情读取。
2. 检查网络层：HTTP 状态码、超时、CORS、重定向、请求取消。
3. 检查业务层：响应 `code`、`message`、核心 `data` 字段、分页/权限/空态与页面展示是否一致。
4. 存在错误时，从 response headers 优先提取 `logId`、`x-tt-logid`、`x-tt-trace-id`、`x-request-id` 等追踪字段。
5. 通过 Argos 定位后端问题；只有当用户提供后端仓库路径、分支/提交权限，并明确要求修复后端时，才修改后端代码、push，并通过 `bytedcli bits` 查询 PPE 发布状态。否则输出后端问题定位和需要后端处理的结论。

## 推荐报告结构

```markdown
## 验收结论
通过 / 未通过 / 待确认

## 静态检查
- biome:
- emo build:

## 商家态
- 类型：测试商家 / 线上真实商家 / 不需要
- shopId:
- 结果:

## PPE / 流水线
- 输入：develop URL / dev-id / pipeline IDs / 不需要
- 目标环境：PPE / BOE
- env:
- pipeline:
- PPE 部署结果:
- 后置节点状态:

## E2E 验证
- 页面:
- 操作:
- UI 断言:
- 接口断言:
- 截图/快照证据:
- logId:

## 验收循环
- 失败项:
- 修复动作:
- 重验范围:
- 重验结果:

## 问题与后续
```
