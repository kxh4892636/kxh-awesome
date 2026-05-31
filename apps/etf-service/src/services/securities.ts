import { listSecurities } from "./market";
import type { SecuritiesService } from "../routes/securities/types";

export const securitiesService = {
  listSecurities: async () => {
    try {
      return {
        securities: await listSecurities(),
      };
    } catch (error) {
      console.error("listSecurities error", error);
      throw error;
    }
  },
} satisfies SecuritiesService;
