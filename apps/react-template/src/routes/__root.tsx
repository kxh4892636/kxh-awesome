import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { Layout, Menu } from "antd";
import { aboutRoute } from "./about-route";
import { indexRoute } from "./index-route";

const { Header, Content } = Layout;

const RootLayout = () => (
  <Layout className="min-h-screen">
    <Header className="flex items-center gap-4! px-6!">
      <span className="text-white font-bold text-lg">React Template</span>
      <Menu
        theme="dark"
        mode="horizontal"
        className="flex-1"
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

export const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);
