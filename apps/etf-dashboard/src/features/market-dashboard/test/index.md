# Market Dashboard Regression

## 目标

验证 ETF K 线看板的核心用户路径在重构、接口消费、图表交互和响应式变更后仍可用。

## 前置条件

- `apps/etf-service` 已启动并监听 `http://localhost:8080`。
- `apps/etf-dashboard` 已启动并监听 `http://localhost:5173`。
- 前端已执行 `vp run gen`、`vp run check` 和 `vp run build`。
- 初始化数据包含 `红利低波100 · 930955.CSI` 和 `中证红利质量 · 932315.CSI`。

## 回归流程

1. 打开 `http://localhost:5173`。
2. 确认浏览器标题为 `ETF Dashboard`。
3. 等待页面显示 `ETF K 线看板` 和默认标的 `红利低波100 · 930955.CSI`。
4. 确认摘要区显示 `最新收盘`、`涨跌幅`、`成交额`、`数据范围`。
5. 确认 K 线卡片显示 `cache · 正整数 条` 或 `refreshed · 正整数 条`。
6. 确认 K 线 canvas 可见，且页面显示默认 MA 图例。
7. 点击 `刷新`，确认当前标的、周期和范围不变。
8. 切换到 `中证红利质量 932315.CSI`，等待标题下方标的同步更新；再切回 `红利低波100 930955.CSI`。
9. 切换周期和范围，至少覆盖 `周` 和 `近一年`。
10. 将均线输入改为 `5 20 60`，确认显示 `MA5`、`MA20`、`MA60`，且旧图例不再显示。
11. 在 K 线图内 hover，确认 tooltip 显示开盘、最高、最低、收盘和成交额等信息。
12. 将视口设置为接近 `390 x 844`，刷新页面，确认 `document.body.scrollWidth <= window.innerWidth`，并重复一次 `周` 和 `近一年` 切换。
13. 临时停止或隔离 `etf-service`，刷新页面并等待错误态稳定出现。
14. 确认页面仍显示应用外壳和 `ETF K 线看板`，并展示 `数据加载失败，请确认 etf-service 已启动`。
15. 恢复 `etf-service`，刷新页面，确认默认看板恢复正常。

## 验收断言

- 页面不白屏。
- 默认标的、摘要区、K 线状态和 MA 图例可见。
- 刷新、标的切换、周期/范围切换、均线输入和 K 线 hover 可用。
- 移动端视口没有横向溢出。
- 后端不可用时有明确错误提示，恢复后可重新加载行情。
- 前端源码不依赖旧 `src/api/gen/**`；生成客户端位于 `src/libs/api/gen/**`。
- 控制台无 React 渲染崩溃或新的应用级 error；停服期间的预期网络失败除外。

## 失败定位

- 页面无法启动：检查 `index.html`、`src/app/main.tsx` 和 `src/app/router.tsx`。
- 请求失败：检查 `VITE_API_BASE_URL`、Connect transport、生成客户端输出路径和 `etf-service` CORS。
- 图表空白：检查行情数据、周期聚合、范围裁剪、canvas 尺寸和控制台错误。
- 移动端溢出：检查工具栏、卡片内边距、K 线容器和 MA 图例换行。
