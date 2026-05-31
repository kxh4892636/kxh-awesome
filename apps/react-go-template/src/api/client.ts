// RPC 传输层 - 配置 ConnectRPC 后端地址，所有 API 请求通过此传输实例发出
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { PostsService } from "./gen/go-template/posts/v1/posts_pb";

// 创建 ConnectRPC 传输实例，baseUrl 指向 Go 后端服务
export const transport = createConnectTransport({
  baseUrl: "http://localhost:8080",
});

// 创建 ConnectRPC 客户端实例，用于调用 Go 后端服务
export const postsClient = createClient(PostsService, transport);
