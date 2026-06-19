import { createLazyRoute } from "@tanstack/react-router";
import { HomePage } from "../../pages/home-page";

export const Route = createLazyRoute("/")({
  component: HomePage,
});
