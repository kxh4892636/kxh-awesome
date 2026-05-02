import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { AboutPage } from "../pages/about-page";

export const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});
