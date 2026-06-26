import { StyleProvider } from "@ant-design/cssinjs";
import { TransportProvider } from "@connectrpc/connect-query";
import { createConnectTransport } from "@connectrpc/connect-web";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { App as AntdApp, ConfigProvider } from "antd";
import { routeTree } from "./routes";

const queryClient = new QueryClient();

const router = createRouter({ routeTree });

// 默认指向本地 etf-service，方便 dashboard 在没有额外环境变量时独立启动调试。
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const transport = createConnectTransport({
  baseUrl: apiBaseUrl,
});

/**
 * 应用根组件集中装配跨页面 Provider，避免路由页面重复关心主题、请求和缓存上下文。
 */
export const App = () => (
  <StyleProvider layer>
    <ConfigProvider>
      <AntdApp>
        <TransportProvider transport={transport}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </TransportProvider>
      </AntdApp>
    </ConfigProvider>
  </StyleProvider>
);
