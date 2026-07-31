import { expect, test } from "./support/fixtures";
import {
  ERROR_ALERT,
  expectDashboardReady,
  headingLocator,
  openDashboard,
} from "./support/dashboard";

/**
 * E2E-S4:服务不可用时用户看到错误并可恢复。
 * 对应 index.md 的 E2E-S4。只有 globalSetup 自己拉起的后端(managed)才能停起;
 * 复用外部后端时整场景跳过。
 */
test("S4 服务不可用时用户看到错误并可恢复", async ({ page, backend }) => {
  // 停服后 connect-query 会重试约 25s 才置为错误态,整个流程(停服+恢复+两轮加载)给足时间。
  test.setTimeout(180_000);
  test.skip(
    backend.state.mode === "external",
    "后端由外部进程管理(:8080 已有健康服务),E2E 不拥有其生命周期,无法停服/恢复",
  );

  // 基线:默认看板正常。
  await openDashboard(page);
  await expectDashboardReady(page);

  // 停服后刷新:应用壳保留并展示错误提示。
  await backend.stop();
  await page.reload();
  await expect(headingLocator(page)).toBeVisible();
  await expect(page.getByText(ERROR_ALERT)).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: "e2e/evidence/s4-unavailable.png", fullPage: true });

  // 恢复后刷新:默认看板回来,不白屏。
  await backend.start();
  await page.reload();
  await expect(headingLocator(page)).toBeVisible();
  await expectDashboardReady(page);
  await page.screenshot({ path: "e2e/evidence/s4-recovered.png", fullPage: true });
});
