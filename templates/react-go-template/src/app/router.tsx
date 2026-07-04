import { createRootRoute, createRouter } from "@tanstack/react-router";
import { createAboutRoute } from "../pages/about/route";
import { createHomeRoute } from "../pages/home/route";
import { RootLayout } from "../pages/root-layout";

const rootRoute = createRootRoute({
  component: RootLayout,
});

export const routeTree = rootRoute.addChildren([
  createHomeRoute(rootRoute),
  createAboutRoute(rootRoute),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
