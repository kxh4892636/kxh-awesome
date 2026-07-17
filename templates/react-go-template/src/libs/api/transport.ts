import { createConnectTransport } from "@connectrpc/connect-web";

interface CreateApiTransportParams {
  baseUrl: string;
}

export const createApiTransport = (
  params: CreateApiTransportParams,
): ReturnType<typeof createConnectTransport> => {
  const { baseUrl } = params;

  try {
    return createConnectTransport({ baseUrl });
  } catch (error) {
    console.error("Unable to create ConnectRPC transport", error);
    throw error;
  }
};
