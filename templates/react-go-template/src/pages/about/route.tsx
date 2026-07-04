import { createRoute } from "@tanstack/react-router";
import type { AnyRootRoute } from "@tanstack/react-router";
import { AboutPage } from "./about-page";

export const createAboutRoute = (parentRoute: AnyRootRoute) =>
  createRoute({
    getParentRoute: () => parentRoute,
    path: "/about",
    component: AboutPage,
  });
