import assert from "node:assert/strict";
import test from "node:test";
import { parseKlineJson } from "./kline-parser";

void test("解析 K 线 JSON 时按交易日排序并补齐可选数值", () => {
  const text = JSON.stringify({
    data: {
      securityCode: "932315.CSI",
      columns: "week,tradeDate,open,high,low,close,volume,amount,change,changePercent",
      items:
        "星期二,2014-01-02,101,103,100,102,,,,;" +
        "星期一,2013-12-31,100,101,99,100.5,10,1000,0.5,0.5",
    },
  });

  const parsed = parseKlineJson({
    text,
    fileName: "fixture.json",
    fallbackSymbol: "932315.CSI",
    adjType: "qfq",
  });

  assert.equal(parsed.securityCode, "932315.CSI");
  assert.equal(parsed.earliestTradeDate, "2013-12-31");
  assert.equal(parsed.latestTradeDate, "2014-01-02");
  assert.deepEqual(
    parsed.bars.map((bar) => bar.tradeDate),
    ["2013-12-31", "2014-01-02"],
  );
  assert.equal(parsed.bars[1]?.volume, 0);
  assert.equal(parsed.bars[1]?.amount, 0);
  assert.equal(parsed.bars[1]?.changeAmount, 1);
});

void test("解析 K 线 JSON 缺少必要字段时抛出明确错误", () => {
  const text = JSON.stringify({
    data: {
      columns: "tradeDate,open,high,low",
      items: "2026-05-29,1,1,1",
    },
  });

  assert.throws(
    () =>
      parseKlineJson({
        text,
        fileName: "fixture.json",
        fallbackSymbol: "932315.CSI",
        adjType: "qfq",
      }),
    /缺少必要字段: close/,
  );
});
