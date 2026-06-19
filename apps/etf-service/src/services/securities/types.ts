import type { Security } from "../../common/schema";
import type { MarketService } from "../market/types";

export type ListSecuritiesRequest = Record<string, never>;

export interface ListSecuritiesResponse {
  securities: Security[];
}

export interface SecuritiesService {
  listSecurities: (params: ListSecuritiesRequest) => Promise<ListSecuritiesResponse>;
}

export interface CreateSecuritiesServiceParams {
  listSecurities: MarketService["listSecurities"];
}
