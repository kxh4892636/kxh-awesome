# Counter 稳定回归

## Scenario: 用户增加和减少计数

```gherkin
Scenario: 用户增加和减少计数
  Given 用户打开首页
  When 用户点击 Increment
  Then counter 数值增加 1
  When 用户点击 Decrement
  Then counter 数值减少 1
```

## Scenario: counter 不会低于 0

```gherkin
Scenario: counter 不会低于 0
  Given counter 当前值为 0
  When 用户点击 Decrement
  Then counter 数值仍为 0
```

## Scenario: counter 不会超过 10

```gherkin
Scenario: counter 不会超过 10
  Given counter 当前值为 9
  When 用户连续点击 Increment 两次
  Then counter 数值为 10
```

## 执行入口

打开首页 `/`，检查 `Zustand Counter + es-toolkit clamp(0, 10)` 区块。
