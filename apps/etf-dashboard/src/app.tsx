import { StyleProvider } from "@ant-design/cssinjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { App as AntdApp, ConfigProvider } from "antd";
import { routeTree } from "./routes";

const queryClient = new QueryClient();

const router = createRouter({ routeTree });

export const App = () => (
  <StyleProvider layer>
    <ConfigProvider>
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  </StyleProvider>
);
