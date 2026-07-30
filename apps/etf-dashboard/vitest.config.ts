import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// 顶层 resolve 不会传入 projects，alias 需在每个 project 内声明；
// fileURLToPath 避免 Windows 下 URL.pathname 的前导斜杠。
const srcAlias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: srcAlias },
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        resolve: { alias: srcAlias },
        test: {
          name: "browser",
          include: ["src/**/*.test.tsx"],
          testTimeout: 15_000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: { channel: "chrome" },
            }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
