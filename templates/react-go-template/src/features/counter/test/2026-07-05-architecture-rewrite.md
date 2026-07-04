# Counter 架构重写验收

## 目标

证明 counter 功能迁移到 `features/counter` 后，用户仍能通过按钮修改计数，且计数保持在 `0..10` 范围内。

## 前置条件

- 前端开发服务器已启动。
- 浏览器打开首页 `/`。
- counter 初始值为 `0`。

## 操作步骤

1. 打开首页。
2. 定位 `Zustand Counter + es-toolkit clamp(0, 10)` 区块。
3. 点击 `Increment` 和 `Decrement`。
4. 在初始值为 `0` 时点击 `Decrement`。
5. 点击 `Increment` 直到计数为 `9`，再连续点击两次 `Increment`。

## 验收断言

```gherkin
Scenario: 用户增加和减少计数
  Given 用户打开首页
  When 用户点击 Increment
  Then counter 数值增加 1
  When 用户点击 Decrement
  Then counter 数值减少 1

Scenario: counter 不会低于 0
  Given counter 当前值为 0
  When 用户点击 Decrement
  Then counter 数值仍为 0

Scenario: counter 不会超过 10
  Given counter 当前值为 9
  When 用户连续点击 Increment 两次
  Then counter 数值为 10
```

## 失败定位

- 如果按钮不可用，先检查 `CounterSection` 是否挂载到首页。
- 如果加减失败，先检查 Zustand store 的 action 是否正确绑定。
- 如果上下限失败，先检查 `clamp` 范围是否仍为 `0, 10`。

## 执行结果

- 执行时间：2026-07-05 01:48。
- 结论：通过。浏览器验证初始值为 `0`，点击 `Decrement` 后仍为 `0`，点击 `Increment` 后可增加，连续点击后上限保持为 `10`。
- 遗留问题：无。
