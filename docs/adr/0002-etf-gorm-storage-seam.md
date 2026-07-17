# ETF 持久化以 GORM store 作为数据库 seam

ETF 的 `MarketStore` 保持数据库无关，由 `GormStore` 通过 `*gorm.DB` 提供生产 adapter，配置统一使用 `DATABASE_DSN`。当前装配只支持 SQLite，但代码和命名不绑定 SQLite；在真正引入 MySQL 或 PostgreSQL 时再增加 dialector 选择与对应集成测试，而不为尚不存在的第二个 adapter 预建 `DATABASE_DIALECT` 或 driver interface。这个设计保留数据库演进空间，同时避免为假设中的变化增加一层空洞抽象。
