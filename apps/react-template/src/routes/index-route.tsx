// 首页路由 - 路径 "/"，挂载 HomePage 组件
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { HomePage } from "../pages/home-page";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});
