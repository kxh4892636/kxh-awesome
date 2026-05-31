// 根路由与布局 - 顶栏导航 + 内容区，所有子路由通过 Outlet 渲染
import { createRootRoute, createRoute, Link, Outlet } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AboutPage } from "../pages/about-page";
import { HomePage } from "../pages/home-page";

// RootLayout 提供全局布局骨架：顶栏导航 + 内容区
const RootLayout = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b bg-background">
      <div className="flex h-14 items-center gap-4 px-6">
        <span className="text-lg font-bold">React Template</span>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/">Home</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/about">About</Link>
          </Button>
        </nav>
      </div>
    </header>
    <main className="p-6">
      <Outlet />
    </main>
  </div>
);

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

// routeTree 是路由树的根节点，子路由通过 addChildren 挂载
export const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);
