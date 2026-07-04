# Posts 架构重写验收

## 目标

证明 posts 功能迁移到 `features/posts` 且 `usePosts` 迁移到 `libs/api/posts.ts` 后，用户仍能看到列表、刷新乱序结果，并在后端不可用时看到错误提示。

## 前置条件

- 成功态与刷新态：`templates/go-template` 后端服务已启动并监听 `http://localhost:8080`。
- 失败态：后端服务已停止，或前端 `VITE_API_BASE_URL` 指向不可用地址。
- 前端开发服务器已启动。
- 浏览器打开首页 `/`。

## 操作步骤

1. 在后端可用时打开首页。
2. 定位 `TanStack Query - JSONPlaceholder Posts` 区块。
3. 记录初始列表前几条 `ID/Title` 顺序。
4. 点击 `Refresh`，最多重复 3 次。
5. 停止后端服务后重新打开首页。

## 验收断言

```gherkin
Scenario: 用户看到 posts 列表
  Given Go 后端服务可用
  When 用户打开首页
  Then 页面展示 posts 区块
  And 表格展示文章标题和内容

Scenario: 用户刷新 posts 并看到乱序结果
  Given Go 后端服务可用
  And posts 列表已加载
  When 用户点击 Refresh
  Then 刷新按钮进入加载状态
  And 请求完成后 posts 列表仍可见
  And 至少一次刷新后，列表顺序相对初始顺序发生变化

Scenario: 后端不可用时展示错误
  Given Go 后端服务不可用
  When 用户打开首页
  Then 页面展示 Failed to fetch posts
```

乱序验收：记录初始列表顺序，最多刷新 3 次；任一次顺序变化即通过。3 次均未变化时记录为待确认，不直接判定功能失败。

## 失败定位

- 如果列表不可见，先检查 Go 后端是否运行、CORS、ConnectRPC 请求和 `VITE_API_BASE_URL`。
- 如果刷新按钮没有加载态，先检查 `isRefetching` 是否传递到按钮。
- 如果错误态不可见，先检查 `isError` 和 Alert 渲染条件。
- 如果生成客户端导入失败，先运行 `vp run gen` 并检查 `src/libs/api/gen`。

## 执行结果

- 执行时间：2026-07-05 01:49。
- 结论：通过。后端可用时列表展示 6 行；点击 `Refresh` 后观察到 loading 状态，刷新后列表顺序变化；后端停止后页面展示 `Failed to fetch posts` 和空数据状态。
- 遗留问题：无。
