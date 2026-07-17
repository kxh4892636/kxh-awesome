import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { AboutPage } from "../pages/about/about-page";
import { HomePage } from "../pages/home/home-page";
import { RootLayout } from "../pages/root-layout";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const homeRoute = createRoute({
  getParentRoute: (): typeof rootRoute => rootRoute,
  path: "/",
  component: HomePage,
});

const aboutRoute = createRoute({
  getParentRoute: (): typeof rootRoute => rootRoute,
  path: "/about",
  component: AboutPage,
});

export const routeTree = rootRoute.addChildren([homeRoute, aboutRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
