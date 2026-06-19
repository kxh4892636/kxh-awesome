import { createRootRoute, createRoute } from "@tanstack/react-router";
import { RootLayout } from "../pages";

export const rootRoute = createRootRoute({
  component: RootLayout,
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
}).lazy(() => import("./lazy/home.lazy").then((module) => module.Route));

export const routeTree = rootRoute.addChildren([indexRoute]);
