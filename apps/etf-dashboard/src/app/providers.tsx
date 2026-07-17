import { StyleProvider } from "@ant-design/cssinjs";
import { TransportProvider } from "@connectrpc/connect-query";
import { createConnectTransport } from "@connectrpc/connect-web";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { App as AntdApp, ConfigProvider } from "antd";
import type { FC, ReactElement } from "react";
import { API_BASE_URL } from "./config";
import { routeTree } from "./router";

const reportQueryError = (error: Error): void => {
  console.error("ETF query failed", error);
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: reportQueryError }),
});

const router = createRouter({ routeTree });

const transport = createConnectTransport({
  baseUrl: API_BASE_URL,
});

export const AppProviders: FC = (): ReactElement => (
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
