"use client";

import { useState } from "react";
import { useSwitchChain, useWriteContract } from "wagmi";
import {
  arbitrumChain,
  baseChain,
  blastChain,
  ethereumChain,
  optimismChain,
} from "@/utils/chains";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/utils/wagmi";
import { useEquitoVote } from "@/providers/equito-vote-provider";
import { Address, isAddress, parseUnits, zeroAddress } from "viem";
import { CircularProgress, TextField } from "@mui/material";
import { Button } from "@/components/button";
import equitoVote from "@/out/EquitoVoteV2.sol/EquitoVoteV2.json";

const equitoVoteAbi = equitoVote.abi;

const defaultFormData = {
  tokenName: "",
  ethereumAddress: "",
  arbitrumAddress: "",
  optimismAddress: "",
  baseAddress: "",
  blastAddress: "",
};

enum FormKeys {
  tokenName = "tokenName",
  ethereumAddress = "ethereumAddress",
  arbitrumAddress = "arbitrumAddress",
  optimismAddress = "optimismAddress",
  baseAddress = "baseAddress",
  blastAddress = "blastAddress",
}

function isOnlyAlphanumeric(text: string) {
  return /^[a-zA-Z0-9]+$/.test(text);
}

export default function SetTokenDataPage() {
  const [formData, setFormData] = useState(defaultFormData);
  const [formErrors, setFormErrors] = useState<Set<FormKeys>>(new Set());
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { writeContractAsync } = useWriteContract();

  const { switchChainAsync } = useSwitchChain();

  const { destinationChain, handleError } = useEquitoVote();

  const onClickSetTokenData = async () => {
    const newFormErrors = new Set<FormKeys>();
    let isFormDataValid = true;
    if (!isOnlyAlphanumeric(formData.tokenName)) {
      newFormErrors.add(FormKeys.tokenName);
      isFormDataValid = false;
    }
    if (!isAddress(formData.ethereumAddress)) {
      newFormErrors.add(FormKeys.ethereumAddress);
      isFormDataValid = false;
    }
    if (!isAddress(formData.arbitrumAddress)) {
      newFormErrors.add(FormKeys.arbitrumAddress);
      isFormDataValid = false;
    }
    if (!isAddress(formData.optimismAddress)) {
      newFormErrors.add(FormKeys.optimismAddress);
      isFormDataValid = false;
    }
    if (!isAddress(formData.baseAddress)) {
      newFormErrors.add(FormKeys.baseAddress);
      isFormDataValid = false;
    }
    if (!isAddress(formData.blastAddress)) {
      newFormErrors.add(FormKeys.blastAddress);
      isFormDataValid = false;
    }
    setFormErrors(newFormErrors);
    if (!isFormDataValid) {
      return;
    }
    setIsAddingToken(true);
    setIsSuccess(false);
    try {
      await switchChainAsync({ chainId: destinationChain.definition.id });
      const hash = await writeContractAsync({
        address: destinationChain.equitoVoteContractV2 as Address,
        abi: equitoVoteAbi,
        functionName: "setTokenData",
        args: [
          formData.tokenName,
          [
            ethereumChain.chainSelector,
            arbitrumChain.chainSelector,
            optimismChain.chainSelector,
            baseChain.chainSelector,
            blastChain.chainSelector,
          ],
          [
            formData.ethereumAddress,
            formData.arbitrumAddress,
            formData.optimismAddress,
            formData.baseAddress,
            formData.blastAddress,
          ],
        ],
        chainId: destinationChain.definition.id,
      });
      await waitForTransactionReceipt(config, {
        hash,
        chainId: destinationChain.definition.id,
      });
      setIsSuccess(true);
    } catch (error) {
      handleError(error);
    }
    setIsAddingToken(false);
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-8">Add new DAO Token</h1>
      <div className="mb-8">
        <TextField
          id="token-name"
          label="Token Name"
          value={formData.tokenName}
          onChange={(e) => {
            const value = e.target.value;
            const newFormErrors = new Set(formErrors);
            if (value !== "" && !isOnlyAlphanumeric(value)) {
              newFormErrors.add(FormKeys.tokenName);
            } else {
              newFormErrors.delete(FormKeys.tokenName);
            }
            setFormErrors(newFormErrors);
            setFormData({ ...formData, tokenName: value });
          }}
          error={formErrors.has(FormKeys.tokenName)}
          helperText={
            formErrors.has(FormKeys.tokenName)
              ? "Please enter a valid token name"
              : ""
          }
          sx={{ width: 250 }}
        />
      </div>

      <div className="mb-8">
        <TextField
          id={FormKeys.ethereumAddress}
          label="Ethereum Address"
          value={formData.ethereumAddress}
          onChange={(e) => {
            const value = e.target.value;
            const newFormErrors = new Set(formErrors);
            if (!isAddress(value)) {
              newFormErrors.add(FormKeys.ethereumAddress);
            } else {
              newFormErrors.delete(FormKeys.ethereumAddress);
            }
            setFormErrors(newFormErrors);
            setFormData({ ...formData, ethereumAddress: value });
          }}
          error={formErrors.has(FormKeys.ethereumAddress)}
          helperText={
            formErrors.has(FormKeys.ethereumAddress)
              ? "Please enter a valid address"
              : ""
          }
          sx={{ width: 350 }}
        />
      </div>

      <div className="mb-8">
        <TextField
          id="arbitrum-address"
          label="Arbitrum Address"
          value={formData.arbitrumAddress}
          onChange={(e) => {
            const value = e.target.value;
            const newFormErrors = new Set(formErrors);
            if (!isAddress(value)) {
              newFormErrors.add(FormKeys.arbitrumAddress);
            } else {
              newFormErrors.delete(FormKeys.arbitrumAddress);
            }
            setFormErrors(newFormErrors);
            setFormData({ ...formData, arbitrumAddress: value });
          }}
          error={formErrors.has(FormKeys.arbitrumAddress)}
          helperText={
            formErrors.has(FormKeys.arbitrumAddress)
              ? "Please enter a valid address"
              : ""
          }
          sx={{ width: 350 }}
        />
      </div>

      <div className="mb-8">
        <TextField
          id="optimism-address"
          label="Optimism Address"
          value={formData.optimismAddress}
          onChange={(e) => {
            const value = e.target.value;
            const newFormErrors = new Set(formErrors);
            if (!isAddress(value)) {
              newFormErrors.add(FormKeys.optimismAddress);
            } else {
              newFormErrors.delete(FormKeys.optimismAddress);
            }
            setFormErrors(newFormErrors);
            setFormData({ ...formData, optimismAddress: value });
          }}
          error={formErrors.has(FormKeys.optimismAddress)}
          helperText={
            formErrors.has(FormKeys.optimismAddress)
              ? "Please enter a valid address"
              : ""
          }
          sx={{ width: 350 }}
        />
      </div>

      <div className="mb-8">
        <TextField
          id={FormKeys.baseAddress}
          label="Base Address"
          value={formData.baseAddress}
          onChange={(e) => {
            const value = e.target.value;
            const newFormErrors = new Set(formErrors);
            if (!isAddress(value)) {
              newFormErrors.add(FormKeys.baseAddress);
            } else {
              newFormErrors.delete(FormKeys.baseAddress);
            }
            setFormErrors(newFormErrors);
            setFormData({ ...formData, baseAddress: value });
          }}
          error={formErrors.has(FormKeys.baseAddress)}
          helperText={
            formErrors.has(FormKeys.baseAddress)
              ? "Please enter a valid address"
              : ""
          }
          sx={{ width: 350 }}
        />
      </div>

      <div className="mb-8">
        <TextField
          id={FormKeys.blastAddress}
          label="Blast Address"
          value={formData.blastAddress}
          onChange={(e) => {
            const value = e.target.value;
            const newFormErrors = new Set(formErrors);
            if (!isAddress(value)) {
              newFormErrors.add(FormKeys.blastAddress);
            } else {
              newFormErrors.delete(FormKeys.blastAddress);
            }
            setFormErrors(newFormErrors);
            setFormData({ ...formData, blastAddress: value });
          }}
          error={formErrors.has(FormKeys.blastAddress)}
          helperText={
            formErrors.has(FormKeys.blastAddress)
              ? "Please enter a valid address"
              : ""
          }
          sx={{ width: 350 }}
        />
      </div>

      <Button isDisabled={isAddingToken} onClick={onClickSetTokenData}>
        Add Token
      </Button>

      {isAddingToken && (
        <div className="flex flex-row items-center mt-3">
          <CircularProgress size={20} />
          <div className="ml-4">Adding token to registry</div>
        </div>
      )}

      {isSuccess && <div className="mt-3">Token added successfully!</div>}
    </div>
  );
}
