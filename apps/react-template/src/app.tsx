import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TransportProvider } from "@connectrpc/connect-query";
import { routeTree } from "./routes/__root";
import { transport } from "./api/client";

const queryClient = new QueryClient();

const router = createRouter({ routeTree });

export const App = () => (
  <TransportProvider transport={transport}>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </TransportProvider>
);
