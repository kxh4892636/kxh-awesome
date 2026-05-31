import { useQuery } from "@tanstack/react-query";
import { getDailyBars, listSecurities } from "../api/market";

export const useSecurities = () => {
  const query = useQuery({
    queryKey: ["securities"],
    queryFn: listSecurities,
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
    queryFn: () => getDailyBars({ symbol: symbol ?? "", adjType: "qfq" }),
  });
  const { data, ...rest } = query;

  return {
    ...rest,
    data,
  };
};
