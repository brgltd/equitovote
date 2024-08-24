import { useMutation } from "@tanstack/react-query";
import { Hex } from "viem";
import { useState } from "react";
import { getEquitoClient } from "../utils/equito-client";

const baseExplorerUrl = "https://explorer.equito.network/messages";

type ExecuteArgs = {
  messageHash: Hex;
  fromTimestamp: number;
  chainSelector: number;
};

export const useApprove = () => {
  const [txLink, setTxLink] = useState<string | undefined>();

  const { mutateAsync: execute, ...rest } = useMutation({
    mutationFn: async ({
      messageHash,
      fromTimestamp,
      chainSelector,
    }: ExecuteArgs) => {
      const equitoClient = await getEquitoClient();

      try {
        const { proof, timestamp } = await equitoClient.getConfirmationTime({
          chainSelector,
          messageHash,
          fromTimestamp,
          listenTimeout: 100,
        });

        const txLink = `${baseExplorerUrl}?hash=${messageHash}`;
        console.log("txLink");
        console.log(txLink);
        setTxLink(txLink);

        return { proof, timestamp };
      } catch (error) {
        console.warn(
          "Error getting confirmation time for ",
          messageHash,
          "\n",
          error
        );

        let proof: Hex | undefined;
        do {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          proof = await equitoClient.getProof(messageHash, chainSelector);
          if (!proof) {
            console.warn(`No proof found for ${messageHash} `);
          }
        } while (!proof);

        setTxLink(`${baseExplorerUrl}?hash=${messageHash}`);
        return { proof, timestamp: undefined };
      }
    },
  });

  return { txLink, execute, ...rest };
};
