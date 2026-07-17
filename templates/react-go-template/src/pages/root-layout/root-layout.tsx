import { Outlet } from "@tanstack/react-router";
import type * as React from "react";
import { AppShell } from "../../common/layout";

export const RootLayout: React.FC = (): React.ReactElement => (
  <AppShell>
    <Outlet />
  </AppShell>
);
