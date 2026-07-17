# ETF 源码目录保留有语义的路由层

ETF 手写代码采用领域优先的目录命名，但保留承担稳定路由职责的 `apps/etf-service/internal/{app,integrations,modules,shared}` 与 `apps/etf-dashboard/src/libs/api`：后端 `internal` 等价于前端 `src`，其一级目录表达装配、外部集成、业务模块和跨模块能力，`libs/api` 则集中前端 RPC 生成物及其调用适配。特性内部的 `components`、`hooks`、`utils` 等泛化层，以及保留路由层之下仍不表达实际内容的目录，应改为领域名称或消除；工具链约定与自动生成目录继续遵循 `code-spec` 的全局例外。这样接受少量有意的分类层，以换取稳定入口，同时阻止更深层目录退化为杂物堆。
