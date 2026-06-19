import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import {
  getDailyBarsRequestSchema,
  getDailyBarsResponseSchema,
  listSecuritiesResponseSchema,
  type GetDailyBarsResponse,
  type ListSecuritiesResponse,
} from "@kxh-awesome/etf-service/rpc";

export const useSecurities = () => {
  const query = useQuery({
    queryKey: ["securities"],
    queryFn: async (): Promise<ListSecuritiesResponse> => {
      try {
        const response = await apiClient.api.securities.list.$post({ json: {} });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(`Failed to fetch securities: ${response.status}`);
        }

        return listSecuritiesResponseSchema.parse(body);
      } catch (error) {
        console.error("listSecurities error", error);
        throw error;
      }
    },
  });
  const { data, ...rest } = query;

  return {
    ...rest,
    data: data?.securities ?? [],
  };
};

export const useDailyBars = (symbol: string | null) => {
  const query = useQuery({
    queryKey: ["daily-bars", symbol],
    enabled: Boolean(symbol),
    queryFn: async (): Promise<GetDailyBarsResponse> => {
      try {
        const request = getDailyBarsRequestSchema.parse({
          symbol: symbol ?? "",
          adjType: "qfq",
        });
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
    },
  });
  const { data, ...rest } = query;

  return {
    ...rest,
    data,
  };
};
