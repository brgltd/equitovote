import { EquitoClient } from "@equito-sdk/client";

let client: EquitoClient;

export const getEquitoClient = async () => {
  if (!client) {
    const wsProvider = import.meta.env.NEXT_PUBLIC_WS_ENDPOINT;
    const archiveWsProvider = import.meta.env.NEXT_PUBLIC_ARCHIVE_WS_ENDPOINT;
    if (!wsProvider || !archiveWsProvider) {
      throw new Error(
        "Missing environment variables NEXT_PUBLIC_WS_ENDPOINT and NEXT_PUBLIC_ARCHIVE_WS_ENDPOINT for Equito client"
      );
    }

    client = await EquitoClient.create({
      wsProvider,
      archiveWsProvider,
    });
  }

  return client;
};

