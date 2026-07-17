<!-- LOOP KIT E2E START -->

# Templates code-spec 重构验收

- 本次截图证据根目录：`C:\Users\kxh\.codex\visualizations\2026\07\17\019f7053-ec4d-70d3-9fbd-498af7ff3b8b\e2e`

## 测试矩阵

| 场景 ID | 消费者旅程            | 执行通道 | 入口                                   | 状态   | 最近结果                      | 证据                       |
| ------- | --------------------- | -------- | -------------------------------------- | ------ | ----------------------------- | -------------------------- |
| E2E-S1  | 无效数据库路径被拒绝  | cli      | `go run ./cmd/seed-posts`              | passed | 退出码 1，错误信息符合预期    | CLI 退出码与错误日志       |
| E2E-S2  | 消费者读取 posts 契约 | api      | `POST /posts.v1.PostsService/GetPosts` | passed | HTTP 200，返回 6 条 posts     | HTTP 状态与响应摘要        |
| E2E-S3  | 用户查看并刷新 posts  | browser  | `/`                                    | passed | 6 行数据，刷新后按钮恢复可用  | 页面断言与截图             |
| E2E-S4  | counter 保持 0..10    | browser  | `/#counter`                            | passed | 上限 10，下限 0               | 控件状态与截图             |
| E2E-S5  | 用户看到实时更新时间  | browser  | `/#live-clock`                         | passed | `22:40:21` 更新为 `22:40:22`  | 前后时间文本               |
| E2E-S6  | 用户查看技术栈        | browser  | `/about`                               | passed | 8 项关键技术全部可见          | 页面断言与截图             |
| E2E-S7  | 后端不可用时展示错误  | browser  | `/`                                    | passed | alert 与 console error 均可见 | 错误提示、控制台日志与截图 |

## 场景

### E2E-S1 - 无效数据库路径被拒绝

- 状态：passed
- 执行通道：cli
- 入口：在 `templates/go-template` 运行 `go run ./cmd/seed-posts`
- 环境与版本：本地工作树，基于 `0af3456773d3b16e71557fd08f1564a4e57db280`
- 身份与数据：`GO_TEMPLATE_DB_PATH` 设置为空白字符串，不访问数据库文件
- 不做范围：不验证 SQLite 文件权限与磁盘故障

```gherkin
Feature: SQLite 配置边界
  Scenario: 无效数据库路径被拒绝
    Given GO_TEMPLATE_DB_PATH 是空白字符串
    When 执行 posts 初始化命令
    Then 命令以非零状态退出
    And 错误日志说明数据库路径不能为空
```

#### Agent 执行步骤

1. 设置空白 `GO_TEMPLATE_DB_PATH`。
2. 执行 `go run ./cmd/seed-posts`。
3. 断言退出码非零且日志包含 `GO_TEMPLATE_DB_PATH cannot be blank`。
4. 记录命令、退出码和输出摘要。

#### 执行记录

| 时间       | 环境与版本             | 执行工具   | 结果   | 证据                                              | 备注             |
| ---------- | ---------------------- | ---------- | ------ | ------------------------------------------------- | ---------------- |
| 2026-07-17 | `0af3456` + 当前工作树 | PowerShell | passed | 退出码 `1`；`GO_TEMPLATE_DB_PATH cannot be blank` | 未创建数据库文件 |

兼容性回归：`.sqlite` 路径和 SQLite `:memory:` DSN 均以退出码 `0` 初始化成功，路径校验未收窄原有 SQLite 契约。

### E2E-S2 - 消费者读取 posts 契约

- 状态：passed
- 执行通道：api
- 入口：`POST http://localhost:8080/posts.v1.PostsService/GetPosts`
- 环境与版本：本地 Go 服务，基于目标工作树
- 身份与数据：默认 SQLite 数据库包含 posts 种子数据
- 不做范围：不验证写入与身份权限

```gherkin
Feature: Posts RPC
  Scenario: 消费者读取 posts 契约
    Given Go 服务监听 localhost:8080
    When 消费者请求非随机 posts 列表
    Then HTTP 状态为 200
    And 响应符合 GetPostsResponse 且至少包含一篇文章
```

#### Agent 执行步骤

1. 启动当前 Go 服务并等待监听日志。
2. 发送 `random=false` 的 ConnectRPC JSON 请求。
3. 断言状态码、响应结构和 posts 数量。
4. 记录请求与响应摘要。

#### 执行记录

| 时间                    | 环境与版本                   | 执行工具        | 结果   | 证据                              | 备注           |
| ----------------------- | ---------------------------- | --------------- | ------ | --------------------------------- | -------------- |
| 2026-07-17 22:33 +08:00 | 临时 SQLite + 当前 Go 工作树 | PowerShell HTTP | passed | HTTP `200`；响应包含 `6` 条 posts | `random=false` |

### E2E-S3 - 用户查看并刷新 posts

- 状态：passed
- 执行通道：browser
- 入口：`http://localhost:4173/`
- 环境与版本：本地 React 与 Go 服务，基于目标工作树
- 身份与数据：无需登录，默认 posts 数据
- 不做范围：不验证随机排序的统计分布

```gherkin
Feature: Posts 页面
  Scenario: 用户查看并刷新 posts
    Given Go 后端服务可用
    When 用户打开首页并点击 Refresh
    Then 页面展示 posts 表格
    And 刷新完成后按钮恢复可用
```

#### Agent 执行步骤

1. 打开首页并等待 posts 表格出现。
2. 记录表格行数和首篇文章标题。
3. 点击 Refresh 并等待完成。
4. 断言表格继续可见并保存首页截图。

#### 执行记录

| 时间                    | 环境与版本             | 执行工具          | 结果   | 证据                                                         | 备注                     |
| ----------------------- | ---------------------- | ----------------- | ------ | ------------------------------------------------------------ | ------------------------ |
| 2026-07-17 22:35 +08:00 | Chrome + 本地 React/Go | Chrome Playwright | passed | `6` 个 `data-row-key` 数据行；刷新后按钮可用；`e2e/home.png` | 截图存于 Codex artifacts |

### E2E-S4 - counter 保持 0..10

- 状态：passed
- 执行通道：browser
- 入口：`http://localhost:4173/#counter`
- 环境与版本：本地 React 服务，基于目标工作树
- 身份与数据：counter 初始值为 0
- 不做范围：不验证页面刷新后的状态持久化

```gherkin
Feature: Counter
  Scenario: counter 保持 0..10
    Given counter 初始值为 0
    When 用户点击 Increment 十一次
    Then counter 数值为 10
    When 用户点击 Decrement 十一次
    Then counter 数值为 0
```

#### Agent 执行步骤

1. 定位 counter 数值和增减按钮。
2. 点击 Increment 十一次并断言数值为 10。
3. 点击 Decrement 十一次并断言数值为 0。
4. 记录控件状态。

#### 执行记录

| 时间                    | 环境与版本             | 执行工具          | 结果   | 证据                                                                       | 备注                                                          |
| ----------------------- | ---------------------- | ----------------- | ------ | -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 2026-07-17 22:40 +08:00 | Chrome + 本地 React/Go | Chrome Playwright | passed | 11 次 Increment 后为 `10`；11 次 Decrement 后为 `0`；`e2e/counter-max.png` | 首轮受运行中源码写入触发的 HMR 中断；文件稳定后从入口重跑通过 |

### E2E-S5 - 用户看到实时更新时间

- 状态：passed
- 执行通道：browser
- 入口：`http://localhost:4173/#live-clock`
- 环境与版本：本地 React 服务，基于目标工作树
- 身份与数据：本机时区与系统时间
- 不做范围：不校准外部授时源

```gherkin
Feature: Live Clock
  Scenario: 用户看到实时更新时间
    Given 用户打开首页
    When 等待超过一秒
    Then 时间文本符合 YYYY-MM-DD HH:mm:ss
    And 时间文本相对初始值发生变化
```

#### Agent 执行步骤

1. 读取 live-clock 初始文本。
2. 等待超过一秒并再次读取。
3. 断言格式正确且文本变化。
4. 记录前后文本。

#### 执行记录

| 时间                    | 环境与版本             | 执行工具          | 结果   | 证据                                                    | 备注               |
| ----------------------- | ---------------------- | ----------------- | ------ | ------------------------------------------------------- | ------------------ |
| 2026-07-17 22:40 +08:00 | Chrome + 本地 React/Go | Chrome Playwright | passed | `2026-07-17 22:40:21` → `2026-07-17 22:40:22`，格式匹配 | 本机 Asia/Shanghai |

### E2E-S6 - 用户查看技术栈

- 状态：passed
- 执行通道：browser
- 入口：`http://localhost:4173/about`
- 环境与版本：本地 React 服务，基于目标工作树
- 身份与数据：无需登录
- 不做范围：不验证依赖 registry 的实时版本

```gherkin
Feature: About 页面
  Scenario: 用户查看技术栈
    Given 用户打开 About 页面
    When Tech Stack 区块加载完成
    Then 页面展示 React、TypeScript、Vite、Ant Design、TanStack Router、TanStack Query、Zustand 和 ConnectRPC
```

#### Agent 执行步骤

1. 打开 About 页面。
2. 等待 Tech Stack 区块可见。
3. 断言关键技术名称并保存截图。

#### 执行记录

| 时间                    | 环境与版本             | 执行工具          | 结果   | 证据                                | 备注                     |
| ----------------------- | ---------------------- | ----------------- | ------ | ----------------------------------- | ------------------------ |
| 2026-07-17 22:40 +08:00 | Chrome + 本地 React/Go | Chrome Playwright | passed | 8 项必需技术无缺失；`e2e/about.png` | 截图存于 Codex artifacts |

### E2E-S7 - 后端不可用时展示错误

- 状态：passed
- 执行通道：browser
- 入口：`http://localhost:4173/`
- 环境与版本：本地 React 服务，Go 服务已停止
- 身份与数据：无需登录
- 不做范围：不诊断后端不可用的具体基础设施原因

```gherkin
Feature: Posts 错误反馈
  Scenario: 后端不可用时展示错误
    Given Go 后端服务不可用
    When 用户打开首页
    Then 页面展示 Failed to fetch posts
    And 控制台记录 Unable to load posts
```

#### Agent 执行步骤

1. 停止本次启动的 Go 服务。
2. 刷新首页并等待请求失败。
3. 断言错误提示与控制台 error log。
4. 保存错误态截图。

#### 执行记录

| 时间                    | 环境与版本                | 执行工具          | 结果   | 证据                                                                                                         | 备注                          |
| ----------------------- | ------------------------- | ----------------- | ------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| 2026-07-17 22:41 +08:00 | Chrome + React；Go 已停止 | Chrome Playwright | passed | alert 为 `Failed to fetch posts`；1 条匹配的 `Unable to load posts` console error；`e2e/backend-offline.png` | 仅停止本次 E2E 启动的后端 PID |

<!-- LOOP KIT E2E END -->
