# ETF 源码目录保留有语义的路由层

ETF 手写代码采用领域优先的目录命名，但保留承担稳定路由职责的 `apps/etf-service/internal/{app,integrations,modules,shared}`、`apps/etf-dashboard/src/libs/api` 与前端一级共享边界 `src/common`：后端 `internal` 等价于前端 `src`，其一级目录表达装配、外部集成、业务模块和跨模块能力，`libs/api` 则集中前端 RPC 生成物及其调用适配。`src/common` 只有在存在真实跨领域共享代码时才落为物理目录，不通过 `.gitkeep`、占位 README 或误放领域代码来维持空壳。特性内部的 `components`、`hooks`、`utils` 等泛化层，以及保留路由层之下仍不表达实际内容的目录，应改为领域名称或消除；现有手写 `index.*` 是稳定入口，路径和文件名不在本次重构中修改；工具链约定与自动生成目录继续遵循 `code-spec` 的全局例外。行情交易日历归 `market`，红色火箭协议日期转换归 adapter，各自保留私有实现，不再用 `shared/utils` 暴露低层日期函数。这样接受少量有意的分类层，以换取稳定入口，同时阻止更深层目录退化为杂物堆。

`internal/shared` 当前只保留两个有凝聚力的模块：`config` 严格加载 `PORT` 与 `DATABASE_DSN`，`database` 装配当前 SQLite dialector。证券目录归 `modules/market`，红色火箭 endpoint、周期、数量和协议映射归 `integrations/hongsehuojian`，不再借配置包跨层共享业务或协议常量。
