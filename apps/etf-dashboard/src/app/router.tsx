import { createRootRoute, createRoute } from "@tanstack/react-router";
import { RootLayout } from "@/common/layout/root-layout";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
}).lazy(() => import("@/pages/home").then((module) => module.Route));

export const routeTree = rootRoute.addChildren([indexRoute]);
