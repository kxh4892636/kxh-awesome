# ETF 契约验证集中在服务端

ETF 服务端拥有外部数据的语义验证责任：严格加载 `.env`，校验 ConnectRPC 请求日期与当前仅支持的 `qfq` 复权口径，以 typed DTO 校验红色火箭响应，并将参数错误、未知证券、调用取消、上游故障和内部故障稳定映射为对应 Connect code。前端不为生成的 protobuf 响应或 `VITE_API_BASE_URL` 增加额外 schema/URL 校验；ConnectRPC 生成客户端作为结构契约，TanStack Query 负责网络状态与一次终端错误日志，组件只展示用户可见状态。这是 ETF 领域 skill 对通用 `code-spec` 风险边界的明确收窄，避免前后端重复维护同一响应模型。
