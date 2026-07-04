import { Outlet } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { AppShell } from "../../common/layout";

export const RootLayout = (): ReactElement => (
  <AppShell>
    <Outlet />
  </AppShell>
);
