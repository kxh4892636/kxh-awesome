import { defineConfig } from "@playwright/test";

/**
 * ETF 看板消费者旅程 E2E。
 * 前端由 webServer 管理(pnpm run dev,5173);后端由 globalSetup 管理:
 * :8080 已有健康服务则复用并标记为外部管理,否则自行 go build 出二进制并拉起。
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "e2e/test-results",
  globalSetup: "./e2e/support/global-setup.ts",
  globalTeardown: "./e2e/support/global-teardown.ts",
  // S4 会停/起后端,所有用例必须串行执行。
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    channel: "chrome",
    screenshot: "on",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
