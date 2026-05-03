// 根路由与布局 - Ant Design Layout + 导航菜单，所有子路由通过 Outlet 渲染
import { createRootRoute, createRoute, Link, Outlet } from "@tanstack/react-router";
import { Layout, Menu } from "antd";
import { AboutPage } from "../pages/about-page";
import { HomePage } from "../pages/home-page";

const { Header, Content } = Layout;

// RootLayout 提供全局布局骨架：顶栏导航 + 内容区
const RootLayout = () => (
  <Layout className="min-h-screen">
    <Header className="flex items-center gap-4! px-6!">
      <span className="text-white font-bold text-lg">React Template</span>
      <Menu
        theme="dark"
        mode="horizontal"
        className="flex-1"
        defaultSelectedKeys={["home"]}
        items={[
          { key: "home", label: <Link to="/">Home</Link> },
          { key: "about", label: <Link to="/about">About</Link> },
        ]}
      />
    </Header>
    <Content className="p-6">
      <Outlet />
    </Content>
  </Layout>
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
