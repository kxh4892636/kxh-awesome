import { Outlet } from "@tanstack/react-router";
import { Layout, Typography } from "antd";

export const RootLayout = () => (
  <Layout className="min-h-screen bg-[#f4f6f8] text-slate-800">
    <Layout.Header className="flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-6 text-slate-800">
      <Typography.Text strong className="text-lg text-slate-800">
        ETF Dashboard
      </Typography.Text>
    </Layout.Header>
    <Layout.Content className="bg-[#f4f6f8] p-4 text-slate-800 md:p-6">
      <Outlet />
    </Layout.Content>
  </Layout>
);
