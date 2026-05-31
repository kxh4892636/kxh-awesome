import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { SECURITIES } from "../config/securities";
import { buildKlineUrl, fetchRemoteKlineBars } from "./hongsehuojian";

const security = SECURITIES[0]!;

afterEach(() => {
  mock.restoreAll();
});

void test("构造日线 URL 时使用 day 周期和上海日期", () => {
  const url = buildKlineUrl({
    security,
    now: new Date("2026-05-31T01:02:03.000Z"),
  });

  assert.equal(url.origin + url.pathname, "https://hongsehuojian.com/fundex-quote/line/kline");
  assert.equal(url.searchParams.get("securityCode"), security.symbol);
  assert.equal(url.searchParams.get("period"), "day");
  assert.equal(url.searchParams.get("count"), "-1000");
  assert.equal(url.searchParams.get("begin"), "20260531");
  assert.equal(url.searchParams.get("adjust"), "1");
  assert.equal(url.searchParams.get("ts"), String(new Date("2026-05-31T01:02:03.000Z").getTime()));
});

void test("获取远端日线时使用 mock fetch 并解析返回数据", async () => {
  const payload = {
    data: {
      securityCode: security.symbol,
      columns: "week,tradeDate,open,high,low,close,volume,amount,change,changePercent",
      items: "星期五,2026-05-29,100,101,99,100.5,10,1000,0.5,0.5",
    },
  };
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    async (): Promise<Response> => new Response(JSON.stringify(payload), { status: 200 }),
  );

  const parsed = await fetchRemoteKlineBars({ security });
  const firstCall = fetchMock.mock.calls[0];

  assert.ok(firstCall);
  const [input, init] = firstCall.arguments as [URL, RequestInit];
  const headers = init.headers as Record<string, string>;
  assert.equal(input.searchParams.get("securityCode"), security.symbol);
  assert.equal(headers.accept, "application/json");
  assert.equal(parsed.securityCode, security.symbol);
  assert.equal(parsed.bars.length, 1);
  assert.equal(parsed.bars[0]?.tradeDate, "2026-05-29");
});

void test("远端返回非 2xx 状态时抛出下载错误", async () => {
  mock.method(
    globalThis,
    "fetch",
    async (): Promise<Response> => new Response("Service Unavailable", { status: 503 }),
  );

  await assert.rejects(() => fetchRemoteKlineBars({ security }), /中证红利质量 下载失败: HTTP 503/);
});
