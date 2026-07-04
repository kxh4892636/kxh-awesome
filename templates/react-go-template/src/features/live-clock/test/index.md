# Live Clock 稳定回归

## Scenario: 用户看到实时更新时间

```gherkin
Scenario: 用户看到实时更新时间
  Given 用户打开首页
  When live-clock 区块加载完成
  Then 页面展示符合 YYYY-MM-DD HH:mm:ss 格式的时间
  And 等待超过 1 秒后，时间文本发生变化
```

## 执行入口

打开首页 `/`，检查 `dayjs - Current Time` 区块。
