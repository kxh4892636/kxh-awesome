# Backend Rules

读取本文件处理 Node/TypeScript 后端、API 路由、service、middleware、数据库访问、后台任务和运行时配置。共享 TypeScript、注释和错误处理规则先读 `common-rules.md`。

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

## 分层规则

- 路由/handler 只做入参校验、鉴权上下文读取、调用 service、响应组装。
- service 承载业务流程，避免直接依赖具体 HTTP 框架对象。
- db query 封装数据库访问，避免在 handler 中散落 SQL/ORM 细节。
- middleware 只处理横切关注点，例如认证、CORS、日志、错误、request id。
- config 负责环境变量解析和默认值，不要在业务函数中散落 `process.env`。

## API 与校验

- 请求体、query、params、headers 和外部 webhook payload 必须在边界校验。
- Zod 或项目现有 schema 工具的复杂用法读取 `references/zod/README.md`。
- 响应结构、错误码和分页格式优先复用项目内约定。
- 接口兼容性变更先确认调用方、契约文件、生成代码和文档影响。

## 数据库与副作用

- 数据库方言、driver、连接池、事务和 migration 策略先查现有配置。
- `push`、`migrate`、`pull`、seed、truncate、批量更新、批量删除等影响真实数据的操作需要明确目标环境和回滚策略。
- 写操作优先放在 service 层协调事务；query 层保持可组合、可测试。
- 外部 API、消息队列、对象存储、邮件、支付等副作用要有超时、错误记录和幂等策略。

## 后台任务

- 定时任务和队列消费者要明确重试、幂等、并发控制和失败告警。
- 长任务不要阻塞请求响应；需要异步处理时返回可追踪状态或任务 ID。
- 本地测试避免直接连接生产资源；需要远程资源时先确认环境。

## 测试与验证

- route 测试覆盖入参校验、错误响应和成功路径。
- service 测试覆盖核心业务分支和副作用失败。
- db query 测试使用项目已有测试数据库或 mock 策略，不临时发明生产连接。
