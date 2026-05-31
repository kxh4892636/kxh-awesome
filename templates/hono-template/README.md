# hono-template

Node.js + Hono RPC 后端模板，接口形状与 `go-template` 的文章查询示例保持一致：

- 请求：`{ random: boolean }`
- 响应：`{ posts: Post[] }`

SQLite 数据库文件保存在 `data/hono-template.sqlite`。服务启动时会自动建表并写入示例数据。

```bash
vp install
vp run dev
```

API 地址：

- `GET /` 健康检查
- `POST /api/posts/getPosts` 获取文章列表

前端通过 `@kxh-awesome/hono-template/rpc` 导入 `hcWithType` 和共享 schema。
