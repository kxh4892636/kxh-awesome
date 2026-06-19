import type {
  CreateSecuritiesServiceParams,
  ListSecuritiesRequest,
  ListSecuritiesResponse,
  SecuritiesService,
} from "./types";

export const createSecuritiesService = (
  params: CreateSecuritiesServiceParams,
): SecuritiesService => {
  const { listSecurities } = params;

  return {
    listSecurities: async (_params: ListSecuritiesRequest): Promise<ListSecuritiesResponse> => {
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
};

export type {
  CreateSecuritiesServiceParams,
  ListSecuritiesRequest,
  ListSecuritiesResponse,
  SecuritiesService,
} from "./types";
