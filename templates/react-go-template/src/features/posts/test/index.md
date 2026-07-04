# Posts 稳定回归

## Scenario: 用户看到 posts 列表

```gherkin
Scenario: 用户看到 posts 列表
  Given Go 后端服务可用
  When 用户打开首页
  Then 页面展示 posts 区块
  And 表格展示文章标题和内容
```

## Scenario: 用户刷新 posts 并看到乱序结果

```gherkin
Scenario: 用户刷新 posts 并看到乱序结果
  Given Go 后端服务可用
  And posts 列表已加载
  When 用户点击 Refresh
  Then 刷新按钮进入加载状态
  And 请求完成后 posts 列表仍可见
  And 至少一次刷新后，列表顺序相对初始顺序发生变化
```

乱序验收最多刷新 3 次；任一次顺序变化即通过。3 次均未变化时记录为待确认。

## Scenario: 后端不可用时展示错误

```gherkin
Scenario: 后端不可用时展示错误
  Given Go 后端服务不可用
  When 用户打开首页
  Then 页面展示 Failed to fetch posts
```

## 执行入口

打开首页 `/`，检查 `TanStack Query - JSONPlaceholder Posts` 区块。
