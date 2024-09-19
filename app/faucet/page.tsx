"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { useWriteContract } from "wagmi";
import { useEquitoVote } from "@/providers/equito-vote-provider";
import { Address } from "viem";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/utils/wagmi";
import { CircularProgress } from "@mui/material";
import { buildTxLink } from "@/utils/helpers";
import faucet from "@/out/Faucet.sol/Faucet.json";

const faucetAbi = faucet.abi;

const buttonStyles = {
  width: "350px",
  textTransform: "none",
};

export default function FaucetPage() {
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txLink, setTxLink] = useState("");

  const { sourceChain, handleError } = useEquitoVote();

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
      setTxLink(buildTxLink(sourceChain, hash));
    } catch (error) {
      handleError(error);
    }
    setIsRequestInProgress(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">
        Request tokens for seamless testing in the Equito Builder Program
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
          onClick={() => onClickRequest(sourceChain?.metaQuorum)}
          isDisabled={isRequestInProgress}
          styles={buttonStyles}
        >
          Request 1000 MetaQuorum Tokens
        </Button>
        <Button
          onClick={() => onClickRequest(sourceChain?.chainLight)}
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

      {isSuccess && (
        <div className="mt-8">
          Tokens added to your account.{" "}
          {txLink && (
            <>
              <a href={txLink} target="_blank" className="inline-link">
                Open Transaction
              </a>
              .
            </>
          )}
        </div>
      )}
    </div>
  );
}
