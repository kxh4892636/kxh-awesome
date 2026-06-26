import { StyleProvider } from "@ant-design/cssinjs";
import { TransportProvider } from "@connectrpc/connect-query";
import { createConnectTransport } from "@connectrpc/connect-web";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { App as AntdApp, ConfigProvider } from "antd";
import { routeTree } from "./routes";

const queryClient = new QueryClient();

const router = createRouter({ routeTree });

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const transport = createConnectTransport({
  baseUrl: apiBaseUrl,
});

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
