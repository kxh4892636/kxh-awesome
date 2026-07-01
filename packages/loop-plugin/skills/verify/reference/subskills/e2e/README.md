# E2E

本子流程负责浏览器验收。E2E 是一次完整用户路径验证：一方面验证前端 UI、交互和页面状态，另一方面验证该路径触发的后端接口、响应数据和页面消费结果。先读取通用原则，再根据业务域决定是否转用业务 skill。

如果本轮代码 push 会触发 BITS 流水线，或用户提供 develop URL / pipeline ID 并要求等待 PPE / BOE 部署，先回到 [pipeline-guard](../pipeline-guard/README.md) 确认目标环境部署完成。默认等待 PPE；只有用户明确 BOE 时才切换 BOE。

## 路由规则

| 场景 | 读取 |
| --- | --- |
| 任意页面验收、截图、交互、DevServer、HMR、网络请求检查 | [reference/general-principles.md](reference/general-principles.md) |
| 体验分 E2E、体验分验收、体验分测试流程沉淀 | 使用 `experience-score` skill 的 `reference/subskills/govern-business-e2e/README.md` |

如果其他治理业务 reference 不存在，使用通用原则完成真实浏览器验收，并把缺失业务流程记录为可沉淀项。

## 执行顺序

1. 确认目标页面、路由、商家态、业务完成标准和是否需要等待 BITS PPE / BOE 部署。
2. 如需要等待部署，先读取 [pipeline-guard](../pipeline-guard/README.md)，按 30 秒轮询确认目标环境部署完成。PPE 完成以项目流水线中的 PPE 部署链路成功为准，不要求整条流水线 completed；`测试验收完成？` 等后置人工确认不阻塞进入 E2E。
3. 应用通用浏览器验收原则。
4. 命中体验分业务时，使用 `experience-score` skill 并只读取对应 E2E 场景文件；其他业务使用通用原则并记录可沉淀项。
5. 沿同一条用户路径同时验证页面交互、UI 状态、网络请求、响应数据和异常信息。
6. 如有失败，修复后只重验失败的路径、步骤、UI 断言或接口断言。
7. 输出结论，区分稳定断言、样例数据和待确认项。

## 循环重验

E2E 失败后不要默认重跑全量流程。先把失败拆成最小可验证单元，再按影响范围重验：

- UI 断言失败：修复前端后，回到失败页面和失败交互步骤，重验该 UI 断言及其直接依赖的接口。
- 接口断言失败：修复前端请求/消费逻辑或后端接口后，回到触发该接口的用户动作，重验接口响应和页面展示。
- 控制台错误：修复后重验触发该错误的页面动作，并确认错误不再出现。
- 商家态或权限失败：只重做商家态准备和后续受影响步骤，已通过的静态检查不重复。
- 代码修复并 push 后：先按 [pipeline-guard](../pipeline-guard/README.md) 确认目标 PPE 部署完成，再回到失败页面路径重验；不要因为后置人工确认或整条流水线未 completed 延迟 E2E。

每次重验都记录“失败项 → 修复动作 → 重验范围 → 结果”，让后续报告能说明闭环过程。

## 证据要求

优先保留可复核证据：

- 页面 URL、标题和关键 DOM 快照。
- 关键交互前后的截图。
- 如本次等待过 PPE / BOE 部署，记录 develop URL / pipeline IDs、env、SCM 版本、Goofy deploymentId / channelId 和后置节点状态。
- 相关接口的请求 URL、状态码、业务 code、核心响应字段，以及这些字段如何被页面消费。
- 控制台错误或网络错误摘要。

不要把动态订单号、商品 ID、客服 ID、分数值等历史样例写成长期稳定断言。
