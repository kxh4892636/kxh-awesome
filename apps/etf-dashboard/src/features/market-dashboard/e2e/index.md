<!-- LOOP KIT E2E START -->

# Market Dashboard Regression

## 测试矩阵

| 场景 ID | 消费者旅程                       | 执行通道 | 入口                    | 状态   | 最近结果                                | 证据                                                                          |
| ------- | -------------------------------- | -------- | ----------------------- | ------ | --------------------------------------- | ----------------------------------------------------------------------------- |
| E2E-S1  | 用户打开看板并看到默认行情       | browser  | `http://localhost:5173` | passed | 默认标的、摘要、4989 条 K 线和 MA 可见  | [2026-07-18 默认看板](2026-07-18-s1-default.png)                              |
| E2E-S2  | 用户完成看板核心交互             | browser  | `http://localhost:5173` | passed | 切换、刷新、tooltip、缩放和拖拽均可用   | [2026-07-18 核心交互](2026-07-18-s2-interactions.png)                         |
| E2E-S3  | 用户在窄屏下使用看板             | browser  | `http://localhost:5173` | passed | `390 x 844` 下无横向溢出                | [2026-07-18 窄屏](2026-07-18-s3-mobile.png)                                   |
| E2E-S4  | 服务不可用时用户看到错误并可恢复 | browser  | `http://localhost:5173` | passed | 错误态保留应用壳，恢复后 Fetch 均为 200 | [不可用](2026-07-18-s4-unavailable.png) / [恢复](2026-07-18-s4-recovered.png) |

## 共同前置条件

- `apps/etf-service` 已启动并监听 `http://localhost:8080`。
- `apps/etf-dashboard` 已启动并监听 `http://localhost:5173`。
- 前端已执行 `vp run gen`、`vp run check` 和 `vp run build`。
- 初始化数据包含 `红利低波100 · 930955.CSI` 和 `中证红利质量 · 932315.CSI`。

## 场景

### E2E-S1 - 用户打开看板并看到默认行情

- 状态：passed
- 执行通道：browser
- 入口：`http://localhost:5173`
- 环境与版本：包含目标改动的本地前后端工作树
- 身份与数据：无需登录；使用共同前置条件中的初始化行情
- 不做范围：不验证行情源数据与交易所原始数据逐笔一致
- 证据要求：默认页面截图；标题、标的、摘要、K 线状态、canvas 和 MA 图例断言
- 执行记录位置：本文“执行记录”

```gherkin
Feature: ETF market dashboard
  Scenario: 用户打开看板并看到默认行情
    Given etf-service 和 etf-dashboard 均已启动
    When 用户打开 ETF 看板并等待行情加载完成
    Then 浏览器标题为 "ETF Dashboard"
    And 页面显示 "ETF K 线看板" 和默认标的 "红利低波100 · 930955.CSI"
    And 摘要区、K 线状态、K 线图和默认 MA 图例均可见
```

### E2E-S2 - 用户完成看板核心交互

- 状态：passed
- 执行通道：browser
- 入口：已完成 E2E-S1 的 ETF 看板
- 环境与版本：包含目标改动的本地前后端工作树
- 身份与数据：无需登录；两个初始化标的均可查询
- 不做范围：不穷举所有周期、范围和均线组合
- 证据要求：标的、周期、范围、MA 图例和 tooltip 的操作前后截图或等价浏览器断言
- 执行记录位置：本文“执行记录”

```gherkin
Feature: ETF market dashboard interactions
  Scenario: 用户完成看板核心交互
    Given 默认 ETF 看板已加载完成
    When 用户刷新并切换标的、周期、范围和均线输入
    Then 当前标的、周期、范围和 MA 图例按选择更新
    And K 线图保持可见且 tooltip、缩放和水平拖拽可用
    And 页面不显示空数据或服务不可用错误
```

### E2E-S3 - 用户在窄屏下使用看板

- 状态：passed
- 执行通道：browser
- 入口：`http://localhost:5173`
- 环境与版本：包含目标改动的本地前后端工作树；视口 `390 x 844`
- 身份与数据：无需登录；默认标的可查询
- 不做范围：不覆盖所有移动设备和浏览器内核
- 证据要求：窄屏整页截图；页面宽度和关键控件可见性断言
- 执行记录位置：本文“执行记录”

```gherkin
Feature: ETF market dashboard responsive layout
  Scenario: 用户在窄屏下使用看板
    Given 浏览器视口为 390 x 844
    When 用户打开 ETF 看板并切换周线和近一年范围
    Then document.body.scrollWidth 不大于 window.innerWidth
    And 控件、摘要、K 线图和 MA 图例均可见可用
```

### E2E-S4 - 服务不可用时用户看到错误并可恢复

- 状态：passed
- 执行通道：browser
- 入口：`http://localhost:5173`
- 环境与版本：包含目标改动的本地前后端工作树
- 身份与数据：无需登录；允许停止并恢复本地 `etf-service`
- 不做范围：不验证代理、DNS 或第三方行情源故障
- 证据要求：停服后的错误态截图、恢复后的默认看板截图和浏览器控制台记录
- 执行记录位置：本文“执行记录”

```gherkin
Feature: ETF service unavailable recovery
  Scenario: 服务不可用时用户看到错误并可恢复
    Given etf-dashboard 正常运行
    When etf-service 不可用并刷新看板
    Then 页面保留应用外壳和 "ETF K 线看板"
    And 页面显示 "数据加载失败，请确认 etf-service 已启动"
    When etf-service 恢复后用户再次刷新页面
    Then 默认看板恢复正常且页面不白屏
```

## Agent 执行步骤

1. 记录当前 commit、前后端启动命令、浏览器和视口。
2. 按共同前置条件启动服务，并等待默认行情加载完成。
3. 依次执行 E2E-S1 至 E2E-S4；每个场景只记录系统边界上的断言。
4. 保存场景要求的截图、浏览器断言和控制台记录。
5. 失败时记录最小失败步骤，修复后重跑失败场景及其直接前置场景。
6. 将时间、环境与版本、工具、结果和证据回写到本文执行记录。

## 执行记录

### 2026-07-18

- 环境与版本：基线 `af03b2c0c7534d71101e0d4f994284b12b96e044` 加本次工作树；E2E 后端二进制 SHA-256 `7351F32A1544E43B5DFA762C1C904B989A5EE709FF7DC607DB4106E9A06066C1`。
- 运行态：`etf-service-e2e.exe` 监听 `8080`，健康检查和 `/doc/` 均为 200；`vp dev --host 127.0.0.1` 监听 `5173`。验收结束后两个端口已释放。
- 执行工具：真实 Chrome、Playwright DOM 断言、CDP Network 事件、浏览器控制台与截图；桌面默认视口和 `390 x 844` 视口。
- E2E-S1：标题、默认标的、摘要、canvas 和 `MA5/8/13/21/34/55` 可见；`ListSecurities` 与 `GetDailyBars` Fetch 均为 200。
- E2E-S2：切换到 `932315.CSI`、周线、近一年和 `MA5/20` 后刷新成功；tooltip 含 OHLC/MA；缩放画布哈希 `f3bbda1b -> 749c1dec`，拖拽后为 `f68aecbc`，MA20 关闭后画布再次变化；两次 Fetch 均为 200。
- E2E-S3：`innerWidth=390`，`body.scrollWidth=documentElement.scrollWidth=375`；控件、摘要、canvas 和 MA 图例可见。
- E2E-S4：停服后应用壳保留，错误提示可见，CDP 捕获 `ERR_CONNECTION_REFUSED`，QueryCache 仅记录一次终端错误；恢复后默认看板、canvas 和两次 200 Fetch 恢复，控制台没有新增错误。
- 结果：E2E-S1 至 E2E-S4 全部 passed。构建仍有既有 500 kB chunk-size warning；停服阶段的网络失败是场景预期。

| 时间       | 环境与版本                                          | 执行工具   | 结果   | 证据                                                                                     | 备注                                                        |
| ---------- | --------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 2026-07-04 | Web architecture refactor 本地工作树；commit 未记录 | 真实浏览器 | passed | 原需求文档记录默认加载、核心交互、`390 x 844` 响应式、服务不可用与恢复均通过；截图未保留 | 构建保留既有 chunk size warning；停服期间的预期网络失败除外 |

<!-- LOOP KIT E2E END -->
