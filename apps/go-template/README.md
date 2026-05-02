# go-template

ConnectRPC Go 后端服务。

## 技术栈

- **Go** 1.23+
- **ConnectRPC** — 类型安全的 RPC 框架
- **Protocol Buffers** — IDL 接口定义

## 项目结构

```
go-template/
├── proto/                 # IDL 定义（接口唯一真实源）
│   └── posts/v1/
│       └── posts.proto
├── gen/                   # 生成代码（只读，不手动编辑）
│   └── posts/v1/
├── internal/              # 业务逻辑（唯一需要写代码的地方）
│   └── service/
└── main.go               # 入口
```

## 快速开始

```bash
# 安装依赖、生成代码
./generate.sh

# 启动服务
go run .
```

服务启动后监听 `http://localhost:8080`。

## 开发流程

```
修改 .proto  →  ./generate.sh  →  在 internal/ 实现接口
```

## 前端联动

前端通过 `connectrpc-gen` CLI 自动同步接口代码：

```bash
cd apps/react-template
npm run gen:api
```
