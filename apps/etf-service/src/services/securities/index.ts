import { listSecurities } from "../market";

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
};
