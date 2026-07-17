import { StyleProvider } from "@ant-design/cssinjs";
import { TransportProvider } from "@connectrpc/connect-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { App as AntdApp, ConfigProvider } from "antd";
import type * as React from "react";
import { createApiTransport } from "../libs/api";
import { appConfig } from "./config";
import { router } from "./router";

const queryClient = new QueryClient();
const transport = createApiTransport({ baseUrl: appConfig.apiBaseUrl });

export const AppProviders: React.FC = (): React.ReactElement => (
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
