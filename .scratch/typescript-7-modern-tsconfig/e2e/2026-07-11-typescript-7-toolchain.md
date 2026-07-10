<!-- LOOP KIT E2E START -->

# TypeScript 7 Toolchain CLI Acceptance

## 测试矩阵

| 场景 ID | 消费者旅程              | 执行通道 | 入口                                | 状态   | 最近结果                            | 证据                                                   |
| ------- | ----------------------- | -------- | ----------------------------------- | ------ | ----------------------------------- | ------------------------------------------------------ |
| E2E-S1  | 工作区解析 TypeScript 7 | cli      | workspace compiler version commands | passed | 5/5 工作区报告 7.0.2                | `vp exec tsc --version`; `vp exec -r -- tsc --version` |
| E2E-S2  | ETF Dashboard 生产构建  | cli      | existing package build command      | passed | TypeScript 与 Vite 构建成功         | `vp run build`；`vp check --fix`                       |
| E2E-S3  | React/Go 模板生产构建   | cli      | existing package build command      | passed | TypeScript 与 Vite 构建成功         | `vp run build`；`vp check --fix`                       |
| E2E-S4  | Wiki 类型检查与生产构建 | cli      | existing Wiki commands              | passed | 类型检查与 Docusaurus 构建成功      | `vp run typecheck`; `vp run build`                     |
| E2E-S5  | 插件测试与声明打包      | cli      | existing plugin commands            | passed | 7/7 测试与 `.d.mts` 打包成功        | `vp run test`; `vp run build`                          |
| E2E-S6  | 根解决方案集成检查      | cli      | root TypeScript solution build      | passed | 四项目引用图与全 workspace 门禁通过 | `vp exec tsc -b`; `vp run -r test`; `vp run -r build`  |

## 场景

### E2E-S1 - 工作区统一解析 TypeScript 7

- 状态：passed
- 执行通道：cli
- 入口：根与各 TypeScript 工作区的正常编译器版本命令
- 环境与版本：本地工作树，Node 版本由仓库固定
- 身份与数据：无需身份或业务数据
- 不做范围：不验证 TypeScript 6 编程 API 兼容层

```gherkin
Feature: TypeScript 7 workspace compiler
  Scenario: Every TypeScript project resolves the native compiler
    Given workspace dependencies were installed through Vite+
    When the compiler version is queried from the root and every TypeScript workspace
    Then every query exits successfully
    And every query reports TypeScript 7.0.2
```

### E2E-S2 - ETF Dashboard 完成真实生产构建

- 状态：passed
- 执行通道：cli
- 入口：ETF Dashboard 现有生产构建命令
- 环境与版本：包含本次迁移改动的本地工作树
- 身份与数据：无需后端服务或业务数据
- 不做范围：不启动浏览器或 ETF 服务

```gherkin
Feature: ETF Dashboard TypeScript 7 build
  Scenario: The migrated dashboard remains buildable
    Given the dashboard uses the shared strict baseline
    When its existing production build command runs
    Then TypeScript checking succeeds
    And the Vite production build exits successfully
```

### E2E-S3 - React/Go 模板完成真实生产构建

- 状态：passed
- 执行通道：cli
- 入口：React/Go 模板现有生产构建命令
- 环境与版本：包含本次迁移改动的本地工作树
- 身份与数据：无需后端服务或业务数据
- 不做范围：不实例化新的模板仓库

```gherkin
Feature: React/Go template TypeScript 7 build
  Scenario: The migrated template remains buildable
    Given the template uses the shared strict baseline
    When its existing production build command runs
    Then TypeScript checking succeeds
    And the Vite production build exits successfully
```

### E2E-S4 - Wiki 完成类型检查与生产构建

- 状态：passed
- 执行通道：cli
- 入口：Wiki 现有类型检查与生产构建命令
- 环境与版本：包含本次迁移改动的本地工作树
- 身份与数据：无需身份或外部数据
- 不做范围：不检查文档文章中的示例程序

```gherkin
Feature: Wiki TypeScript 7 build
  Scenario: Only executable site code is checked and built
    Given the Wiki project includes site configuration and application source
    When its type-check and production build commands run
    Then documentation examples do not enter the application compiler project
    And both commands exit successfully
```

### E2E-S5 - 插件通过测试并生成声明

- 状态：passed
- 执行通道：cli
- 入口：Docusaurus 插件现有测试与打包命令
- 环境与版本：包含本次迁移改动的本地工作树
- 身份与数据：使用现有测试数据
- 不做范围：不发布 npm 包

```gherkin
Feature: Docusaurus plugin TypeScript 7 package
  Scenario: The plugin remains correct and consumable
    Given the plugin uses its strict NodeNext configuration
    When its existing tests and packaging build run
    Then all tests pass
    And bundled declarations are generated successfully
```

### E2E-S6 - 根解决方案覆盖四个项目

- 状态：passed
- 执行通道：cli
- 入口：根 TypeScript 解决方案构建
- 环境与版本：包含全部迁移票的本地工作树
- 身份与数据：无需身份或业务数据
- 不做范围：不修复范围外格式问题或 deprecated 内容警告

```gherkin
Feature: TypeScript 7 monorepo solution
  Scenario: The root solution verifies every migrated project
    Given all four leaf projects completed their migration
    When the root TypeScript solution build runs
    Then it traverses exactly the four referenced projects
    And it exits without repository-owned type errors
```

## Agent 执行步骤

1. 记录当前 commit、Node、Vite+ 与 TypeScript 版本。
2. 按依赖图完成对应 ticket 后执行该场景入口。
3. 记录命令、退出码和关键输出摘要。
4. 失败时只修复证据指向的最小范围，并重跑失败场景及其直接依赖。
5. 最终集成时重跑 E2E-S1 至 E2E-S6，并回写执行记录。

## 执行记录

| 时间       | 环境与版本                                                | 执行工具  | 结果   | 证据                                                                                                                                                                                                                                                        | 备注                                                                    |
| ---------- | --------------------------------------------------------- | --------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 2026-07-11 | commit 4a46b3d 后的本地工作树；Node 24.15.0；Vite+ 0.1.23 | Vite+ CLI | passed | `vp install` 首次 exit 1：插件 `prepare → vp pack` 报 `Cannot read properties of undefined (reading 'useCaseSensitiveFileNames')`；加入官方并行别名后重跑同一 `vp install` exit 0；根与 4 个工作区执行 `vp exec -r -- tsc --version` 均输出 `Version 7.0.2` | `tsc6` 仅供旧工具 API 使用；Vite+ 保持 0.1.23                           |
| 2026-07-11 | Ticket 02 本地工作树；TypeScript 7.0.2                    | Vite+ CLI | passed | ETF 类型检查、聚焦检查与生产构建均 exit 0                                                                                                                                                                                                                   | 仅有既存的 chunk 大小警告                                               |
| 2026-07-11 | Ticket 03 本地工作树；TypeScript 7.0.2                    | Vite+ CLI | passed | 模板类型检查、聚焦检查与生产构建均 exit 0                                                                                                                                                                                                                   | 仅有既存的 chunk 大小警告                                               |
| 2026-07-11 | Ticket 04 本地工作树；TypeScript 7.0.2                    | Vite+ CLI | passed | Wiki 类型检查与 Docusaurus 生产构建均 exit 0                                                                                                                                                                                                                | 仅有既存 blog 目录与重复路由警告；文档内容未改动                        |
| 2026-07-11 | Ticket 05 本地工作树；TypeScript 7.0.2                    | Vite+ CLI | passed | 插件严格检查、7/7 测试与声明打包均 exit 0                                                                                                                                                                                                                   | `dist` 无 tracked diff；TS6 API 别名由 Ticket 01 的真实失败触发         |
| 2026-07-11 | Ticket 06 集成工作树；TypeScript 7.0.2；Node 24.15.0      | Vite+ CLI | passed | 冻结锁安装、5/5 版本、根 `tsc -b`、Wiki typecheck、全 workspace 7/7 测试与全部构建均 exit 0；32 个任务文件通过 UTF-8 无 BOM、无混合 EOL、无尾随空白检查；`git -c core.whitespace=cr-at-eol diff --check` exit 0                                             | 构建仅保留既存 chunk、blog 目录和重复路由警告；无部署或浏览器运行态适用 |

<!-- LOOP KIT E2E END -->
