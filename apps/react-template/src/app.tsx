// 应用根组件 - 组装 Provider 层：RPC 传输 → 查询客户端 → 路由
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TransportProvider } from "@connectrpc/connect-query";
import { routeTree } from "./routes";
import { transport } from "./api/client";

const queryClient = new QueryClient();

const router = createRouter({ routeTree });

// App 顶层组件，嵌套三层 Provider：
//   TransportProvider  - 注入 ConnectRPC 传输实例
//   QueryClientProvider - 注入 TanStack Query 客户端
//   RouterProvider      - 注入 TanStack Router 路由树
export const App = () => (
  <TransportProvider transport={transport}>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </TransportProvider>
);
