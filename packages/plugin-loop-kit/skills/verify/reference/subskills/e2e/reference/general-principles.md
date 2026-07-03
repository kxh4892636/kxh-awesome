# 通用浏览器验收原则

适用于功能实现后的页面验收。目标是在真实浏览器中确认改动已生效，并在同一条 E2E 路径中发现静态检查覆盖不到的页面、交互和接口问题。

## 前置条件

- Codex 自带 Chrome 插件可操作浏览器。
- 如本轮代码 push 触发 BITS 流水线，或用户提供 develop URL / pipeline ID 并要求等待 PPE / BOE 部署，先完成 [pipeline-guard](../../pipeline-guard/README.md)。默认等待 PPE；只有用户明确 BOE 时才切换 BOE。
- 已识别目标 app、workspace、路由和页面 URL。

## PPE / BOE 部署前置

浏览器 E2E 应在目标环境可用后执行。需要等待 BITS 部署时，使用 [pipeline-guard](../../pipeline-guard/README.md) 的口径：

- 每 30 秒轮询一次 BITS develop / pipeline 状态。
- PPE 完成以各项目流水线中的 PPE 部署链路成功为准，不要求整条流水线 completed。
- 需要 PPE 的项目流水线应完成 `部署PPE`、test/PPE `SCM compile`、`初始化PPE 环境`、`PPE小流量部署` / Goofy deploy。
- `测试验收完成？`、bycaps、QCSS、Code Review、合入检查等 PPE 后置节点不阻塞进入 E2E；报告中记录它们的当前状态即可。
- 如果 PPE 或其之前节点失败，先判断是否由代码导致。代码问题修复后重新 push 并轮询新流水线；平台、权限、资源或外部服务问题按阻塞 / 待确认报告，不要为了制造新 push 做无意义代码改动。

## Dev Server 与页面定位

1. 检查是否已有目标 app 的 dev server：

   ```bash
   ps aux | grep -E "emo start|edenx|webpack" | grep -v grep
   ```

2. 有进程时等待 HMR 编译最新代码后继续；无进程时询问用户是否需要启动 `emo start <workspace-name>`。
3. 从修改文件定位页面目录，例如 `src/pages/<module>/...`。
4. 读取路由配置，找到页面 `path`。
5. 结合 app `AGENTS.md` 的访问域名和路由前缀拼接 URL。
6. 使用 Codex 自带 Chrome 插件查找已打开页面；未找到时导航到目标 URL 或请用户打开页面。

## 验证方法

根据改动类型组合使用 Codex 自带 Chrome 插件能力：

- `tab.playwright.domSnapshot()`：验证文案、结构、按钮状态、弹窗内容，并为 locator 构造提供依据。
- `tab.screenshot()`：验证布局、样式、遮挡、响应式状态。
- `tab.playwright.evaluate(...)`：检查普通 DOM、localStorage、页面文本和可在隔离上下文读取的状态。
- `tab.capabilities.get('cdp')` + `Runtime.evaluate`：读取页面主执行上下文中的全局变量，例如 ECOP 的 `window.__PRELOAD_CONTEXT__`。当普通 evaluate 看不到页面全局变量时，优先切到 CDP。
- `tab.playwright` locator 或 `tab.dom_cua`：模拟用户操作，触发表单、弹窗、抽屉、筛选和提交。
- `tab.dev.logs(...)`：检查运行时错误。
- `tab.capabilities.get('cdp')` + `Network.*` 事件：检查接口调用和响应。

文案、数据和状态类改动优先用脚本或快照验证；视觉样式类改动需要截图。

## E2E 内的接口检查

页面验收时同步检查本次改动相关接口。接口检查不是独立于 E2E 的额外阶段，而是每个关键页面动作的内置断言：

1. 找到与页面加载、查询、提交、保存、导出等动作相关的请求。
2. 检查 HTTP 状态码、请求取消、超时、CORS 和重定向。
3. 检查业务响应 code/message 和核心 data 字段。
4. 确认页面展示与接口数据一致。
5. 若发现错误，提取响应 header 中的 logId/traceId，并进入 backend troubleshooting。

## 失败后的最小重验

发现问题后进入循环：定位失败项、修改对应前端或后端代码、重新验收失败项。已通过的步骤不重复，除非修复可能影响它们。

示例：

- `biome` 失败不进入浏览器验收，先修复代码并重跑失败文件的 `biome` 检查。
- 某个按钮点击后弹窗文案错误，修复后只重验打开该弹窗的交互和文案断言。
- 某个查询接口返回错误，修复请求参数或后端接口后，只重验触发该查询的用户动作、接口响应和页面展示。
- 后端修复 push 后，先按 pipeline-guard 确认 PPE 部署完成，再回到触发该接口的 E2E 步骤，确认接口成功且 UI 已消费正确数据。

## 注意事项

- 不要跳过 HMR 等待；代码修改后至少等待页面编译和热更新完成。
- 抽屉、弹窗、二级菜单内的改动必须先触发对应交互再验证。
- 不要主动刷新页面；只有发现 HMR 未生效或页面状态异常时再刷新。
- 验证阶段不运行 `pnpm biome check --write` 这类自动格式修复命令。
- 等待 PPE / BOE 部署时不要把整条流水线 completed 作为 E2E 前置条件；目标部署链路完成即可开始页面验收。
- 截图前先处理会遮挡目标区域的活动弹窗、权限弹窗或登录弹窗，并记录处理动作。

## 验证结果

报告时结论前置：

- 通过：说明验证了什么，证据是什么。
- 未通过：描述具体现象、复现步骤、相关接口/console 信息和建议修复方向。
- 待确认：说明缺少的权限、数据、环境或用户输入。
