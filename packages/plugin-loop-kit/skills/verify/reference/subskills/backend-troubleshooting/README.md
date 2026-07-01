# Backend Troubleshooting

本子流程用于 E2E 过程中发现接口错误后的后端定位。它覆盖 logId 提取、Argos 诊断、后端修复边界、push 和 PPE 部署完成确认。PPE 状态判断复用 [pipeline-guard](../pipeline-guard/README.md)，不要在本文件里另起一套判定口径。

## 触发场景

- 页面网络请求 HTTP 非 2xx、超时、CORS、请求取消或网关错误。
- HTTP 成功但业务 `code` 非成功、`message` 异常或核心 `data` 缺失。
- 页面展示和接口数据不一致，需要确认后端返回是否正确。
- 用户要求根据 `logId`、TraceID 或 request ID 排查。
- 用户明确要求修复后端并等待 PPE 部署完成。

## logId 提取

使用 Codex 自带 Chrome 插件查看失败请求详情，优先从 response headers 提取：

- `logId`
- `x-tt-logid`
- `x-tt-trace-id`
- `x-request-id`
- 其他同义 trace/request 字段

同时记录：

- 请求 URL、method、query/body 的关键字段。
- HTTP 状态码。
- 业务 code/message。
- 发生时间和环境。
- 页面操作路径。

## Argos 预检查

每个会话首次使用 Argos 前检查 CLI：

```bash
ARGOS_BIN="$(command -v argos 2>/dev/null || true)"
if [ -z "$ARGOS_BIN" ] && [ -x "$HOME/.local/bin/argos" ]; then
  ARGOS_BIN="$HOME/.local/bin/argos"
fi
if [ -z "$ARGOS_BIN" ]; then
  echo "NOT_INSTALLED"
else
  echo "INSTALLED: $ARGOS_BIN"
fi
```

如果未安装，引导用户在普通终端安装并登录，不要自动执行 `curl | sh` 安装命令。常见安装方式：

```bash
npm install -g @byted/bits-cli@latest --registry https://bnpm.byted.org
bitscli plugin install argos
```

首次登录需在普通终端执行 `argos` 并完成飞书扫码。JWT 或 token 属于敏感信息，不要回显。

## Argos 查询

优先按精确 logId 查询：

```bash
$ARGOS_BIN tool log logid_prune '{"log_id":"<LOG_ID>","scan_span_in_min":1}'
```

如果缺少 logId，但知道服务、接口或错误现象，使用中文问题调用：

```bash
$ARGOS_BIN run "分析这个接口报错：<接口、现象、时间、环境、业务 code/message>" --output-format text -y --timeout 300000 --show-session
```

规则：

- 始终使用 `run` 子命令，不使用交互式 `chat`。
- `run` 始终带 `-y`、`--output-format text`、`--timeout 300000`、`--show-session`。
- 日志查询优先用精确 logId，`scan_span_in_min` 默认 1。
- 多次查询串行执行，不并发。
- 认证错误时提示用户重新登录 Argos，不自动重试。
- 输出中出现 session ID 时，在报告中记录。

## 后端修复边界

默认只定位问题，不修改后端代码。只有同时满足以下条件，才进入后端修复：

1. 用户明确要求修复后端。
2. 用户提供后端仓库路径或当前工作区已包含对应后端代码。
3. 用户确认目标分支、提交权限和 push 方式。
4. 问题已通过 logId/日志/代码定位到可修改的后端实现。

不满足条件时，输出：

- 失败接口和 logId。
- Argos 诊断摘要和 session ID。
- 疑似后端服务、接口、错误原因。
- 建议后端 owner 处理的事项。

## 修复、push 与 PPE 部署状态

进入后端修复后：

1. 先读取后端仓库规范和相关代码，不跨范围重构。
2. 最小化修复并执行后端仓库对应测试。
3. 按用户确认的方式提交并 push。
4. 获取 BITS develop URL、dev-id 或 pipeline IDs 后，进入 [pipeline-guard](../pipeline-guard/README.md)。
5. 按 pipeline-guard 每 30 秒轮询，确认目标 PPE 部署完成后，回到触发该接口的 E2E 用户路径，只重验失败接口对应的步骤。
6. 重验时同时确认接口响应恢复正常、核心数据正确、前端 UI 已正确消费新响应。

`bytedcli` 查询命令以当前可用帮助为准。先运行相关帮助确认子命令：

```bash
bytedcli bits --help
```

然后根据 BITS develop URL、dev-id 或 pipeline IDs 查询流水线和 PPE 部署状态。PPE 完成以项目流水线中的 PPE 部署链路成功为准，不要求整条流水线 completed；`测试验收完成？`、自动化测试、QCSS、Code Review 等 PPE 后置节点不阻塞 E2E 重验。报告中明确：

- commit / MR / Bits ID
- PPE 是否部署完成，以及判定证据
- 如整体流水线未完成，后置节点当前状态
- 查询时间
- 查询命令结果摘要

## 后端修复后的重验

后端修复不是排障结束点，PPE 部署完成后的 E2E 重验才是闭环结束点。

重验范围：

- 只重验触发失败接口的页面路径和用户动作。
- 检查同一个接口的 HTTP 状态、业务 code/message、核心 data 字段。
- 检查页面是否用修复后的响应渲染出正确 UI、空态、权限态或提交结果。
- 如果该后端修复影响多个前端入口，补充重验受影响入口；不影响的已通过流程不重复。

## 报告格式

```markdown
## 后端排障结论
定位到后端问题 / 未定位 / 需要权限或后端 owner 介入

## 失败请求
- URL:
- HTTP:
- 业务 code/message:
- logId:

## Argos 结果
- session:
- 摘要:

## 修复边界
- 是否修改后端:
- 原因:

## PPE 状态
- Bits ID:
- 状态:

## E2E 重验
- 重验路径:
- 接口结果:
- UI 结果:
```
