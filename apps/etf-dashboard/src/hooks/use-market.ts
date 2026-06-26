import { useQuery } from "@connectrpc/connect-query";
import { type GetDailyBarsResponse, type Security } from "../api/gen/etf-service/etf/v1/etf_pb";
import {
  getDailyBars,
  listSecurities,
} from "../api/gen/etf-service/etf/v1/etf-EtfService_connectquery";

interface UseSecuritiesResult {
  data: Security[];
  isLoading: boolean;
  isError: boolean;
}

interface UseDailyBarsResult {
  data: GetDailyBarsResponse | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => unknown;
}

export const useSecurities = (): UseSecuritiesResult => {
  const query = useQuery(listSecurities, {});

  return {
    data: query.data?.securities ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useDailyBars = (symbol: string | null): UseDailyBarsResult => {
  const query = useQuery(
    getDailyBars,
    {
      symbol: symbol ?? "",
      adjType: "qfq",
    },
    {
      enabled: Boolean(symbol),
    },
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
};
