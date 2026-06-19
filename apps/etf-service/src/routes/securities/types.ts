import type { ListSecuritiesRequest, ListSecuritiesResponse } from "./schema";

export interface SecuritiesService {
  listSecurities: (params: ListSecuritiesRequest) => Promise<ListSecuritiesResponse>;
}

export interface CreateSecuritiesRoutesParams {
  securitiesService: SecuritiesService;
}
