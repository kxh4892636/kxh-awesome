import { Button, Layout, Space, Typography } from "antd";
import { Link } from "@tanstack/react-router";
import type * as React from "react";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = (props: AppShellProps): React.ReactElement => {
  const { children } = props;

  return (
    <Layout className="min-h-screen bg-[#f5f7fb] text-slate-800">
      <Layout.Header className="flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-6 text-slate-800">
        <Typography.Text strong className="text-lg text-slate-800">
          React Go Template
        </Typography.Text>
        <Space>
          <Button type="text" className="text-slate-700">
            <Link to="/" className="text-inherit">
              Home
            </Link>
          </Button>
          <Button type="text" className="text-slate-700">
            <Link to="/about" className="text-inherit">
              About
            </Link>
          </Button>
        </Space>
      </Layout.Header>
      <Layout.Content className="bg-[#f5f7fb] p-6 text-slate-800">{children}</Layout.Content>
    </Layout>
  );
};
