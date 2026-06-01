import { createRootRoute, createRoute } from "@tanstack/react-router";
import { RootLayout } from "../pages";
import { HomePage } from "../pages/home-page";

export const rootRoute = createRootRoute({
  component: RootLayout,
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

export const routeTree = rootRoute.addChildren([indexRoute]);
