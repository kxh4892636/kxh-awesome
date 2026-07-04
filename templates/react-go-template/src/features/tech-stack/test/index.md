# Tech Stack 稳定回归

## Scenario: 用户查看模板技术栈

```gherkin
Scenario: 用户查看模板技术栈
  Given 用户打开 About 页面
  When 页面加载完成
  Then 页面展示 React、TypeScript、Vite、Ant Design、TanStack Router、TanStack Query、Zustand 和 ConnectRPC
```

## 执行入口

打开 About 页面 `/about`，检查 `Tech Stack` 区块。
