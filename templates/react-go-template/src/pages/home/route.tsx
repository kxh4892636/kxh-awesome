import { createRoute } from "@tanstack/react-router";
import type { AnyRootRoute } from "@tanstack/react-router";
import { HomePage } from "./home-page";

export const createHomeRoute = (parentRoute: AnyRootRoute) =>
  createRoute({
    getParentRoute: () => parentRoute,
    path: "/",
    component: HomePage,
  });
