# BITS PPE 流水线守护

本子流程负责在代码 push 后、或用户提供 BITS develop URL / pipeline ID 后，确认 PPE 环境已经部署完成，再进入浏览器验收。它的目标不是等待整条流水线结束，而是确认验收依赖的 PPE 产物和环境已经可用。

## 触发条件

命中任一条件时执行本流程：

1. 本轮有代码变更并由 agent 执行 `git push`，因为 push 会触发 BITS 流水线重新运行。
2. 用户提供 BITS `develop/detail` URL、`dev-id`、pipeline ID 或明确要求确认 PPE / BOE 部署状态。
3. 用户要求“确认发布到 PPE”“等 PPE 部署完成后验收”“流水线完成后验收”等发布前置验证。

默认守护 **PPE**。只有用户明确说 BOE 环境，才把目标切换为 BOE。

## 输入识别

### Develop URL / dev-id

如果用户提供 develop URL 或 dev-id，先读取研发任务详情：

```bash
bytedcli --json bits develop get --url '<develop-url>'
bytedcli --json bits develop get --dev-id <dev-id>
```

从返回中提取：

- `pipeline_failures` 中的主流水线和项目流水线。
- `lanes.ppe` / `ppe_env_name` / `ppe_cn_env_name`。
- `need_ppe`、`project_list`、`pipeline_id`、`pipeline_run_id`。

### Pipeline IDs

如果用户直接提供 pipeline ID，则逐个查询：

```bash
bytedcli --json bits pipeline <pipeline-id>
```

当用户提供多条 pipeline ID 时，全部纳入守护范围。通常包含一条主流水线和多条项目子流水线。

## PPE 完成判定

PPE 完成以各项目流水线中的 PPE 部署链路成功为准，不要求整条流水线 completed。

每条需要 PPE 的项目流水线都满足以下条件时，才算 PPE 部署完成：

1. `部署PPE` selector 成功，且命中 PPE 分支；或等价证据表明该项目需要并进入 PPE 链路。
2. test/PPE SCM 产物编译节点成功，例如 `SCM compile`，输出包含 SCM repo、版本、commit。
3. `初始化PPE 环境` 成功，并能看到目标 env 名。
4. `PPE小流量部署` / Goofy PPE deploy 节点成功。
5. Goofy 节点输出中尽量记录 `deploymentId`、`channelId`、env 名、SCM 版本、完成时间等证据。

以下节点属于 PPE 后置验证或人工门禁，不阻塞“PPE 已部署完成”的判断：

- `测试验收完成？`
- bycaps / 自动化测试平台节点
- QCSS / 质量门禁
- Code Review / Codebase CI
- 合入、发布单可合入性检查

如果这些后置节点失败或等待，应在报告中标注“流水线整体未完成 / 后续节点状态”，但可以继续浏览器 E2E 验收。

## 多流水线规则

- 主流水线用于判断整体阻塞和定位子流水线，不直接作为 PPE 完成证据。
- 项目流水线用于判断对应 PC/H5/服务项目是否完成 PPE 部署。
- develop 任务包含多个项目时，所有需要 PPE 的项目流水线都必须完成 PPE 部署。
- 如果某条项目流水线没有 PPE 节点，但 `need_ppe=false` 或项目明确不需要 PPE，记录为“不需要 PPE”，不要误判失败。
- 如果用户明确只要求某个端型或某条 pipeline，按用户指定范围守护，并在报告中说明范围。

## 轮询策略

每 30 秒轮询一次，直到命中停止条件。每轮给用户简短状态更新，包含：

- 当前时间。
- pipeline ID、run ID / runSeq。
- run 状态。
- 正在 running / waiting / failed 的关键 job。
- PPE 相关 job 的最新状态。

停止条件：

1. 所有目标项目流水线的 PPE 部署完成，进入商家态和浏览器 E2E 验收。
2. PPE 或其之前节点失败，且判断为代码问题，进入修复代码、重新 push、重新轮询新流水线。
3. PPE 或其之前节点失败，但判断为平台、权限、资源、人工审批或外部服务问题；尝试允许的安全重试，不可重试或重试失败时标为阻塞 / 待确认。
4. 用户明确要求停止。

不要因为后置人工确认节点 `awaiting_approval` 继续等待；PPE 完成后应继续验收。

## 实战卡点与纠偏

### push 与最新 run 对齐

- 如果用户要求“以本地分支为例”或要求 agent push，先确认当前分支、工作区状态、HEAD commit、远端同名分支状态。
- `git push` 只能推送已提交内容。若工作区还有本次要纳入流水线的改动，先按用户意图 commit / amend，再 push。
- 如果普通 push 被 non-fast-forward 拒绝，不要直接覆盖远端。先说明远端提交和本地 HEAD 的差异，得到用户明确授权后才使用 `git push --force-with-lease`。
- push 成功后，优先从 push 输出、develop change URL 或 `bytedcli --json bits pipeline <pipeline-id>` 中确认最新 runSeq。守护的 run 必须满足：
  - `runParams.branch` / `source_branch` 是当前分支。
  - `runParams.sdlc_info[*].commit_hash` 或等价字段等于刚 push 的 HEAD commit。
  - `triggeredAt` 晚于本次 push 时间。
- 如果 pipeline 查询返回多个 runs，只守护与本次 push commit 对齐的最新 run，不要误报旧 run 的部署结果。

### 不要硬编码 jobStatus 数字

BITS 返回的 `jobStatus` 数字不要自行猜测映射。不同原子或阶段下，同一个数字在文本层面的含义可能和直觉不一致；例如 PPE `SCM compile` 曾出现 `jobStatus=3`、`completedAt=""`、`pipeline runStatus=2`、`runningCount=1`，实际仍处于运行 / 编辑中，而不是已经失败。

判断 job 是否真的失败时，至少交叉检查：

- pipeline 是否仍在运行：`runStatus`、`runningCount`、`blockingCount`。
- job 是否已有 `completedAt`。
- job-run 详情里的 `failReason`、`atomErrType`、失败 step、`notification_data.ErrMessage` 是否有明确错误。
- job 当前允许的 operations，以及操作接口返回的真实提示。
- 用户或 BITS 页面明确展示的状态文本。

如果 `SCM compile` 已有版本号 / versionId、`failReason=null`、`ErrMessage` 为空、`completedAt` 为空，且 pipeline 仍在运行，按“仍在处理中”继续 30 秒轮询，不要报告失败。

### 本地验证使用仓库 pnpm

排查 BITS `SCM compile` 失败时，常需要在本地重跑 `biome` / lint。运行任何 `pnpm` 命令前先确认根 `package.json.packageManager`，优先使用：

```bash
corepack pnpm biome check <file...>
corepack pnpm lint:changed
```

不要默认使用 Codex runtime 或系统 PATH 中的 `pnpm`。如果 `pnpm -v` 与仓库声明不一致，可能在进入 `biome` 前触发错误的依赖状态检查、忽略 `package.json` 中的 pnpm 配置，进而出现 lockfile config mismatch。此类失败是本地工具链版本问题，不等同于代码检查失败；先切到仓库 pnpm 版本再重跑。

### 重试前先确认状态

不要看到疑似失败状态就立即 retry。先用：

```bash
bytedcli --json bits job-run <job-run-id> --pipeline-run-id <run-id> --outputs
bytedcli --json bits job-run list-operations --pipeline-run-id <run-id> --space-id <space-id>
```

确认 job 已经真正失败且支持重试后，再执行 retry。若 retry 接口返回类似 `status:"running"`、`job operation is not allow`、只允许 `custom/cancel/reschedule/force_skip/fail` 等提示，说明该 job 可能仍在运行或不支持普通 retry；继续轮询或按平台可用操作处理，不要把 retry 失败当作代码失败。

### PPE 完成时间取值

报告“PPE 部署完成时间”时，优先使用 `PPE小流量部署` / Goofy PPE deploy 节点的 `completedAt`，而不是 SCM compile 完成时间或整条流水线完成时间。

同时记录：

- PPE `SCM compile` 的完成时间与 commit / version。
- `初始化PPE 环境` 完成时间。
- `PPE小流量部署` 完成时间。
- Goofy `deploymentId`、`channelId`。
- 后置节点状态，例如 `测试验收完成？` 是否等待。

## 失败处理

失败时先定位原因，不要机械修改代码。

1. 使用 `bytedcli bits pipeline <pipeline-id>` 找到失败 job。
2. 使用 `bytedcli bits job-run <job-run-id> --pipeline-run-id <run-id>` 查看失败详情、steps / atoms、fail reason。
3. 判断失败类型：
   - 代码问题：lint、build、test、类型检查、SCM 编译、产物构建等由代码导致的失败。修复代码后重新 push，并轮询新流水线。
   - 非代码问题：鉴权、平台超时、资源不足、权限缺失、Goofy / SCM 临时错误、外部服务异常、人工审批。先尝试安全重试；仍失败则输出阻塞证据。
4. 不为“制造一次新 push”做无意义代码改动。

## 报告证据

报告中至少包含：

- 输入来源：develop URL / dev-id / pipeline IDs。
- 守护目标：PPE 或 BOE。
- PPE env 名。
- 每条项目流水线的 pipeline ID、run ID / runSeq、项目名。
- PPE 编译产物：repo、版本、commit。
- PPE 部署证据：Goofy deploymentId、channelId、部署节点完成时间。
- 后置节点状态：例如是否停在 `测试验收完成？`。
- 结论：PPE 已完成 / 未完成 / 阻塞，以及是否已进入 E2E 验收。
