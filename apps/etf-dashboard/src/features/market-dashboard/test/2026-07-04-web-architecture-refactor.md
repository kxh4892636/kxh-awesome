# Web Architecture Refactor

## 目标

验证 ETF 看板迁移到 `app / pages / features / libs / common` 分层后，用户可观察行为保持不变；生成客户端迁移到 `src/libs/api/gen/**` 后，证券列表、日线请求、刷新、错误态和图表交互仍沿真实 ConnectRPC 链路工作。

## 前置条件

- `apps/etf-service` 已启动并监听 `http://localhost:8080`。
- `apps/etf-dashboard` 已启动并监听 `http://localhost:5173`。
- 前端已执行 `vp run gen` 和 `vp run build`。
- 初始化数据包含 `红利低波100 · 930955.CSI` 和 `中证红利质量 · 932315.CSI`。

## 场景

```gherkin
Scenario: 用户打开 ETF 看板并看到默认行情
  Given etf-service 和 etf-dashboard 均已启动
  When 用户打开 http://localhost:5173
  Then 浏览器标题为 "ETF Dashboard"
  And 页面显示 "ETF K 线看板"
  And 默认标的显示 "红利低波100 · 930955.CSI"
  And 摘要区显示最新收盘、涨跌幅、成交额和数据范围
  And K 线卡片显示 cache 或 refreshed 状态和正整数行数
```

```gherkin
Scenario: 用户完成看板核心交互
  Given 用户已打开默认 ETF 看板
  When 用户切换标的、周期、范围和均线输入
  Then 当前标的、周期、范围和 MA 图例按用户选择更新
  And K 线图保持可见且不显示空数据或服务不可用错误
```

```gherkin
Scenario: 用户在窄屏下使用看板
  Given 浏览器视口接近 390 x 844
  When 用户打开 ETF 看板并切换周线和近一年范围
  Then 页面没有横向溢出
  And 控件、摘要、K 线图和 MA 图例均可见可用
```

```gherkin
Scenario: 后端不可用时用户看到错误提示
  Given etf-dashboard 正常运行
  When etf-service 不可用并刷新看板
  Then 页面仍显示应用外壳和 "ETF K 线看板"
  And 页面显示 "数据加载失败，请确认 etf-service 已启动"
  And 页面不白屏
```

## 操作步骤

1. 启动 `apps/etf-service`。
2. 启动 `apps/etf-dashboard`。
3. 打开 `http://localhost:5173`，等待页面显示默认标的和 K 线图。
4. 点击刷新，确认当前标的、周期和范围不变。
5. 切换到 `中证红利质量 932315.CSI`，再切回 `红利低波100 930955.CSI`。
6. 依次切换周期 `周`、`月`、`季`、`年`、`日`。
7. 依次切换范围 `近一年`、`近三年`、`近五年`、`近十年`、`全部`。
8. 将均线输入改为 `5 20 60`，确认图例更新；再输入 `5 5 abc 1000 13`，确认只保留有效去重后的 MA。
9. 在 K 线图内 hover、滚轮缩放和水平拖拽，确认 tooltip 和图表仍可用。
10. 将视口调整到接近 `390 x 844`，刷新后确认无横向溢出并重复一次周线和近一年切换。
11. 临时停止或隔离 `etf-service`，刷新页面，等待并确认服务不可用错误提示；恢复服务后刷新页面确认恢复。

## 验收断言

- `document.title === "ETF Dashboard"`。
- 页面显示 `ETF K 线看板`。
- 默认标的、摘要区、K 线状态、MA 图例和刷新行为与重构前一致。
- 标的、周期、范围、均线、图例、hover、缩放和拖拽交互可用。
- 移动端视口下 `document.body.scrollWidth <= window.innerWidth`。
- 后端不可用时展示既有错误提示，恢复后刷新可回到正常看板。
- 控制台无 React 渲染崩溃或应用级 error；停服期间的预期网络失败除外。
- 前端源码不再依赖 `src/api/gen/**`，生成客户端位于 `src/libs/api/gen/**`。

## 失败定位

- 页面无法启动：检查 `index.html` 的入口脚本和 `src/app/main.tsx`。
- 路由无法渲染：检查 `src/app/router.tsx`、lazy route 和页面导出。
- 请求失败：检查 `VITE_API_BASE_URL`、Connect transport、生成客户端导入路径和 `etf-service` CORS。
- 图表空白：检查行情数据聚合、范围裁剪、canvas 尺寸和控制台错误。
- 移动端横向溢出：检查工具栏最小宽度、卡片内边距、图表容器和 MA 图例换行。

## 执行结果

通过。

- `vp run gen` 通过，生成客户端输出到 `src/libs/api/gen/etf-service/**`。
- `vp run check` 通过。
- `vp run build` 通过；Vite 保留既有 chunk size warning。
- 真实浏览器加载默认看板通过：标题、默认标的、摘要区、K 线状态、MA 图例和 canvas 均正常。
- 真实浏览器核心交互通过：刷新、标的切换、周期/范围切换、均线输入和 tooltip 均正常。
- 真实浏览器移动端验收通过：`390 x 844` 视口下无横向溢出，周线和近一年范围可用。
- 后端不可用验收通过：页面保留应用外壳并展示服务不可用提示；恢复服务后看板可恢复正常。
- 本次稳定流程已合并到 `test/index.md`。
