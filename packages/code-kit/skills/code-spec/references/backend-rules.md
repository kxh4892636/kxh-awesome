# Backend Rules

读取本文件处理后端架构、Node/TypeScript 后端、API/RPC 路由、service/use case、repository、integration、middleware、数据库访问、后台任务和运行时配置。共享 TypeScript、注释和错误处理规则先读 `common-rules.md`。

## 项目结构

后端 TypeScript 项目默认组织：

```text
src/
├── main.ts           # 服务启动入口，监听端口或导出 runtime handler
├── app.ts            # 应用装配：全局中间件、路由挂载、错误处理
├── config/           # 环境变量、运行时配置、常量
├── common/           # 共享类型、枚举、错误码、响应结构
├── routes/           # 路由定义，按业务域拆分
│   └── [domain]/
│       ├── index.ts
│       ├── handlers.ts
│       ├── schema.ts
│       └── types.ts
├── middleware/       # 认证、CORS、日志、错误、request id 等中间件
├── services/         # 业务逻辑，保持与 HTTP 框架解耦
├── db/               # 数据库连接、schema、migration 辅助
│   ├── client.ts
│   ├── schema/
│   └── queries/
├── jobs/             # 定时任务、队列消费者、后台处理
├── libs/             # 外部 API、消息队列、对象存储、第三方 SDK 封装
├── utils/            # 纯工具函数
└── tests/            # route、service、db query 测试
```

## 核心模型

后端架构中心是业务用例，不是目录、ORM、框架或某个 service 结构体本身。先从用户请求或系统行为识别业务用例，再决定入口、业务流程、数据访问和外部集成如何拆分。

```text
Handler / Controller / RPC
        ↓
Service / Use Case
        ↓
Repository / Integration
        ↓
Database / Third-party
```

## 分层规则

- Handler / Controller / RPC 只做协议适配、入参校验、鉴权上下文读取、调用 service/use case、响应组装。
- Service / Use Case 承载业务流程、业务规则、依赖能力定义和事务边界，避免直接依赖具体 HTTP/RPC 框架对象。
- Repository 封装数据访问、ORM/SQL 查询和数据库模型映射，避免在 handler 或 service 中散落 SQL/ORM 细节。
- Integration / Client 封装第三方服务调用和外部协议，不承载核心业务规则。
- middleware 只处理横切关注点，例如认证、CORS、日志、错误、request id。
- config 负责环境变量解析和默认值，不要在业务函数中散落 `process.env`。
- App / Main 只做实例创建、依赖装配、服务启动和路由注册，不写业务流程细节。

## 实例装配

- 实例创建集中在启动层，由外向内装配依赖：config/logger/db/client → repository/integration → service/use case → handler/router。
- 业务对象通过构造函数或工厂函数接收依赖，不在内部创建数据库连接、repository、logger、第三方 client 等基础设施。
- Service 依赖抽象能力，测试时可以替换 repository 或 integration 实现。
- 不要在 service 内部直接 `new` repository 或读取全局基础设施；这会隐藏依赖、降低可测试性并扩大变更影响。
- 小项目可以依赖启动层装配暴露接口不匹配；分层严格或包循环风险高时，把 port/interface 放到独立边界模块。

## 接口与能力设计

- 接口由使用方定义，结构体或类由实现方提供；service 需要什么能力，就在 service/use case 附近定义最小接口。
- Repository 方法从业务用例倒推，不预设完整 CRUD；例如列表用例只需要 `list`，按 ID 查询和创建需求出现后再扩展。
- Service 接口只有在上层确实需要替换、mock 或多实现时再定义，不为形式感增加抽象。
- 实现层可以添加编译期或测试期约束来暴露方法缺失、签名不匹配和依赖装配错误。

## API 与校验

- 请求体、query、params、headers 和外部 webhook payload 必须在边界校验。
- Zod 或项目现有 schema 工具的复杂用法读取 `references/zod/README.md`。
- 响应结构、错误码和分页格式优先复用项目内约定。
- 接口兼容性变更先确认调用方、契约文件、生成代码和文档影响。

## 数据库与副作用

- 数据库方言、driver、连接池、事务和 migration 策略先查现有配置。
- `push`、`migrate`、`pull`、seed、truncate、批量更新、批量删除等影响真实数据的操作需要明确目标环境和回滚策略。
- 写操作优先由 service/use case 协调事务；repository/query 层保持可组合、可测试。
- 外部 API、消息队列、对象存储、邮件、支付等副作用要有超时、错误记录和幂等策略。

## 后台任务

- 定时任务和队列消费者要明确重试、幂等、并发控制和失败告警。
- 长任务不要阻塞请求响应；需要异步处理时返回可追踪状态或任务 ID。
- 本地测试避免直接连接生产资源；需要远程资源时先确认环境。

## 测试与验证

- route 测试覆盖入参校验、错误响应和成功路径。
- service 测试覆盖核心业务分支和副作用失败。
- db query 测试使用项目已有测试数据库或 mock 策略，不临时发明生产连接。

## 审查判断

- 请求链路能从入口追到 service/use case、repository/integration、数据库或第三方依赖。
- 业务规则集中在 service/use case，不散落在 handler、SQL、脚本或 middleware 中。
- 数据访问集中在 repository/query，第三方协议集中在 integration/client。
- 实例装配集中在 main/app/启动层，业务层没有隐藏创建基础设施。
- 接口粒度来自业务用例真实需要，依赖方向保持上层依赖抽象能力、实现细节留在外层。
