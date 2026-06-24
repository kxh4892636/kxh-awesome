import { createRootRoute, createRoute } from "@tanstack/react-router";
import { RootLayout } from "../pages";
import { AboutPage } from "../pages/about-page";
import { HomePage } from "../pages/home-page";

export const rootRoute = createRootRoute({
  component: RootLayout,
});

export const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

export const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);
