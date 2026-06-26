# etf-service

## 技术栈与架构入口

- Go 1.23+ ConnectRPC 后端，使用 GORM 和 SQLite。
- `main.go` 启动 HTTP server，注册 ConnectRPC handler、CORS、h2c、健康检查和内嵌 API 文档。
- `proto/etf/v1/etf.proto` 是 API 契约唯一源头。
- `internal/service/market.go` 是行情业务用例实现，负责缓存刷新、日期裁剪、休市标记和查询编排。

## 关键模块

- `proto/`：Protocol Buffers 契约，先改 proto，再生成代码。
- `internal/config/`：环境变量和支持证券配置。
- `internal/database/`：SQLite/GORM 打开逻辑。
- `internal/model/`：GORM 表模型，映射 `securities`、`daily_bars`、`trading_calendar`。
- `internal/repository/`：行情持久化访问边界。
- `internal/service/`：业务逻辑，与 ConnectRPC 和 GORM 细节解耦。
- `internal/integration/`：外部行情源封装。
- `internal/marketdata/`：行情日期工具和红色火箭 K 线 JSON 解析。
- `internal/rpc/`：ConnectRPC handler 适配层。
- `gen/` 和 `docs/`：生成物，只读。

## 对外接口

- `GET /`：健康信息。
- `EtfService.ListSecurities`：列出支持的证券。
- `EtfService.GetDailyBars`：查询日线 K 线数据，必要时刷新本地缓存。
- `/doc/`：内嵌 HTML API 文档。

## 依赖关系

- 被 `apps/etf-dashboard` 通过生成的 ConnectRPC TypeScript 客户端调用。
- 不再作为 pnpm workspace package 暴露。
- 运行时依赖本地 SQLite 数据文件和红色火箭行情源。

## 项目命令

- `./generate.sh`：生成 Go 代码和 API 文档。
- `go run .`：启动服务。
- `go test ./...`：运行 Go 测试/编译检查。

## 生成物

- `gen/` 和 `docs/index.html` 是生成物，不手动编辑。
- `data/` 下 SQLite 文件是运行数据，不把手工编辑作为常规开发路径。

## 验证方式

- 改 proto 后运行 `./generate.sh`，再运行 `go test ./...`。
- 改 `internal/` 或 `main.go` 后运行 `go test ./...`。
- 改 proto 后还要在 `apps/etf-dashboard` 运行 `vp run gen` 并验证前端构建。
