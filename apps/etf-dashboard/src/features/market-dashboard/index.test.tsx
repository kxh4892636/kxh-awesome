import { describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import {
  createEtfTransport,
  makeDailyBars,
  makeSecurity,
  renderWithProviders,
  unavailableError,
} from "../../test-support/render";
import { MarketDashboard } from "./index";

const bodyText = (): string => document.body.textContent ?? "";

describe("MarketDashboard", () => {
  test("服务不可用时展示错误提示且保留应用壳", { timeout: 20_000 }, async () => {
    const transport = createEtfTransport({
      listError: unavailableError(),
      barsError: unavailableError(),
    });
    await renderWithProviders(<MarketDashboard />, transport);

    await expect
      .poll(bodyText, { timeout: 15_000 })
      .toContain("数据加载失败，请确认 etf-service 已启动");
    expect(bodyText()).toContain("ETF K 线看板");
  });

  test("成功加载后自动选中第一个标的并展示摘要与图例", { timeout: 20_000 }, async () => {
    const securities = [makeSecurity(), makeSecurity({ symbol: "510500", name: "上证50ETF" })];
    const transport = createEtfTransport({
      securities,
      security: securities[0],
      bars: makeDailyBars(40),
    });
    await renderWithProviders(<MarketDashboard />, transport);

    await expect.poll(bodyText, { timeout: 15_000 }).toContain("沪深300ETF · 510300");
    expect(bodyText()).toContain("最新收盘");
    expect(bodyText()).toContain("hit · 40 条");
    await expect.element(page.getByRole("button", { name: "MA5", exact: true })).toBeVisible();
    expect(document.querySelector("canvas")).not.toBeNull();
  });
});
