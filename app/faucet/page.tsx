"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { useWriteContract } from "wagmi";
import { useEquitoVote } from "@/providers/equito-vote-provider";
import { Address } from "viem";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/utils/wagmi";
import { CircularProgress } from "@mui/material";
import faucet from "@/out/Faucet.sol/Faucet.json";

const faucetAbi = faucet.abi;

const buttonStyles = {
  width: "350px",
  textTransform: "none",
};

export default function FaucetPage() {
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { sourceChain, setToastMessage, setIsToastOpen } = useEquitoVote();

  const { writeContractAsync } = useWriteContract();

  const onClickRequest = async (tokenAddress: Address | undefined) => {
    setIsRequestInProgress(true);
    setIsSuccess(false);
    try {
      const hash = await writeContractAsync({
        address: sourceChain?.faucet as Address,
        abi: faucetAbi,
        functionName: "drip",
        args: [tokenAddress],
        chainId: sourceChain?.definition?.id,
      });
      await waitForTransactionReceipt(config, {
        hash,
        chainId: sourceChain?.definition?.id,
      });
      setIsSuccess(true);
    } catch (error) {
      const isUserRejection = error
        ?.toString()
        ?.includes("User rejected the request");
      if (!isUserRejection) {
        setToastMessage("Error occurred creating proposal. Please try again.");
        setIsToastOpen(true);
      }
      console.error(error);
    }
    setIsRequestInProgress(false);
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-8">
        Request testnet tokens for ease of testing
      </h1>
      <div className="space-y-8">
        <Button
          onClick={() => onClickRequest(sourceChain?.voteSphere)}
          isDisabled={isRequestInProgress}
          styles={buttonStyles}
        >
          Request 1000 VoteSphere Tokens
        </Button>
        <Button
          onClick={() => onClickRequest(sourceChain?.voteSphere)} // TODO: update this
          isDisabled={isRequestInProgress}
          styles={buttonStyles}
        >
          Request 1000 MetaQuorum Tokens
        </Button>
        <Button
          onClick={() => onClickRequest(sourceChain?.voteSphere)} // TODO: update this
          isDisabled={isRequestInProgress}
          styles={buttonStyles}
        >
          Request 1000 ChainLight Tokens
        </Button>
      </div>

      {isRequestInProgress && (
        <div className="flex flex-row mt-8">
          <CircularProgress size={20} />
          <div className="ml-4">Requesting tokens</div>
        </div>
      )}

      {isSuccess && <div className="mt-8">Tokens added to your account!</div>}
    </div>
  );
}
