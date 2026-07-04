import { StyleProvider } from "@ant-design/cssinjs";
import { TransportProvider } from "@connectrpc/connect-query";
import { createConnectTransport } from "@connectrpc/connect-web";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { App as AntdApp, ConfigProvider } from "antd";
import { API_BASE_URL } from "./config";
import { routeTree } from "./router";

const queryClient = new QueryClient();

const router = createRouter({ routeTree });

const transport = createConnectTransport({
  baseUrl: API_BASE_URL,
});

export const AppProviders = () => (
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
