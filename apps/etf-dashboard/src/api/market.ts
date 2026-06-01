import { apiClient } from "./client";
import {
  getDailyBarsRequestSchema,
  getDailyBarsResponseSchema,
  listSecuritiesResponseSchema,
  type GetDailyBarsRequest,
  type GetDailyBarsResponse,
  type ListSecuritiesResponse,
} from "@kxh-awesome/etf-service/rpc";

export const listSecurities = async (): Promise<ListSecuritiesResponse> => {
  try {
    const response = await apiClient.api.securities.list.$post({
      json: {},
    });
    const body = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to fetch securities: ${response.status}`);
    }

    return listSecuritiesResponseSchema.parse(body);
  } catch (error) {
    console.error("listSecurities error", error);
    throw error;
  }
};

export const getDailyBars = async (params: GetDailyBarsRequest): Promise<GetDailyBarsResponse> => {
  try {
    const request = getDailyBarsRequestSchema.parse(params);
    const response = await apiClient.api.market.getDailyBars.$post({
      json: request,
    });
    const body = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to fetch daily bars: ${response.status}`);
    }

    return getDailyBarsResponseSchema.parse(body);
  } catch (error) {
    console.error("getDailyBars error", error);
    throw error;
  }
};
