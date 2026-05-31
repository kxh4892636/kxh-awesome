import { readFile } from "node:fs/promises";
import { SECURITIES, getSeedFilePath } from "../config/securities";
import { parseKlineJson } from "../libs/kline-parser";
import { upsertDailyBars, upsertSecurity } from "../services/market";

export const seedDatabase = async (): Promise<void> => {
  for (const security of SECURITIES) {
    const seedPath = getSeedFilePath({ seedFile: security.seedFile });
    const text = await readFile(seedPath, "utf8");
    const parsed = parseKlineJson({
      text,
      fileName: security.seedFile,
      fallbackSymbol: security.symbol,
      adjType: security.adjType,
    });

    await upsertSecurity({
      security,
      earliestTradeDate: parsed.earliestTradeDate,
    });
    await upsertDailyBars({
      bars: parsed.bars,
      exchange: security.exchange,
    });
  }
};
