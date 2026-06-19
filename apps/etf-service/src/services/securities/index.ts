import type {
  CreateSecuritiesServiceParams,
  ListSecuritiesRequest,
  ListSecuritiesResponse,
  SecuritiesService,
} from "./types";

/**
 * 创建证券查询服务（浅层适配器）。
 * 当前仅包装 marketService.listSecurities 并加上 try-catch 和 response 封装。
 * 如果后续需要独立的证券业务逻辑（如过滤、排序、检索），在此扩展。
 */
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
