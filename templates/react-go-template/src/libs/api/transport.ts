import { createConnectTransport } from "@connectrpc/connect-web";

interface CreateApiTransportParams {
  baseUrl: string;
}

export const createApiTransport = (
  params: CreateApiTransportParams,
): ReturnType<typeof createConnectTransport> => {
  const { baseUrl } = params;

  return createConnectTransport({ baseUrl });
};
