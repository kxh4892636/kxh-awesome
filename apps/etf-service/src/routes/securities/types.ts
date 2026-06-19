import type { SecuritiesService } from "../../services/securities/types";

export type SecuritiesRoutesService = Pick<SecuritiesService, "listSecurities">;

export interface CreateSecuritiesRoutesParams {
  securitiesService: SecuritiesRoutesService;
}
