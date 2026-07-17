# ETF 行情

这个上下文描述 `etf-dashboard` 与 `etf-service` 共同使用的行情领域语言，避免把产品名、证券实体和资产类型混为一谈。

## Language

**ETF 产品**：
由 `etf-dashboard` 和 `etf-service` 组成的行情产品；产品可以管理 ETF、指数等多种证券。
_Avoid_：用 ETF 指代系统中的每一个证券

**证券（Security）**：
系统可列出并查询行情的统一标的，其具体类别由资产类型表达。
_Avoid_：ETF、Index（用作所有标的的统称时）

**资产类型（Asset Type）**：
证券的类别，例如 ETF 或指数；它是证券的属性，不是证券实体的替代名称。
_Avoid_：Security Type

**前复权（qfq）**：
当前系统支持的日线价格复权口径，使历史价格按当前价格尺度连续展示。
_Avoid_：`adjust=1`（红色火箭协议参数）
