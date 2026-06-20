# go-template

## 技术栈与架构入口

- Go 1.23+ ConnectRPC 后端模板。
- `main.go` 是 HTTP server 入口，注册 ConnectRPC handler、CORS、h2c 和内嵌 API 文档。
- `proto/posts/v1/posts.proto` 是 API 契约唯一源头。
- `internal/service/posts.go` 是业务实现入口。

## 关键模块

- `proto/`：Protocol Buffers 契约，先改 proto，再生成代码。
- `internal/service/`：业务逻辑和 ConnectRPC service handler 实现。
- `main.go`：服务注册、文档挂载和 server 生命周期。
- `generate.sh`：生成 Go 代码和 HTML API 文档。
- `buf.gen.yaml`、`buf.gen.doc.yaml`：代码和文档生成配置。
- `gen/`：生成的 Go protobuf 和 ConnectRPC 代码，只读。
- `docs/index.html`：由 proto 注释生成的 API 文档，只读。

## 对外接口

- `PostsService.GetPosts`：在 `proto/posts/v1/posts.proto` 中定义。
- ConnectRPC handler 由 `postsv1connect.NewPostsServiceHandler(postsService)` 注册。
- `/doc/`：内嵌 HTML API 文档。

## 依赖关系

- 被 `templates/react-go-template` 通过生成的 ConnectRPC TypeScript 客户端调用。
- 前端客户端由 `@kxh-awesome/connectrpc-gen` 从本模板 `proto/` 生成。
- 不依赖其他 workspace 应用。

## 项目命令

- `./generate.sh`：生成 Go 代码和 API 文档。
- `go run .`：启动服务。
- `go test ./...`：运行 Go 测试/编译检查。

## 生成物

- `gen/` 和 `docs/index.html` 是生成物，不手动编辑。

## 验证方式

- 改 proto 后运行 `./generate.sh`，再运行 `go test ./...`。
- 改 `internal/` 或 `main.go` 后运行 `go test ./...`。
- 改 proto 后还要在 `templates/react-go-template` 运行 `vp run gen:api go-template` 并验证前端构建。
