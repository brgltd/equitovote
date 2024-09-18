"use client";

import { use, useState } from "react";
import { useSwitchChain, useWriteContract } from "wagmi";
import { arbitrumChain, ethereumChain, optimismChain } from "@/utils/chains";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/utils/wagmi";
import { useEquitoVote } from "@/providers/equito-vote-provider";
import { Address, isAddress, parseUnits } from "viem";
import { CircularProgress, TextField } from "@mui/material";
import { Button } from "@/components/button";
import equitoVote from "@/out/EquitoVoteV2.sol/EquitoVoteV2.json";

const equitoVoteAbi = equitoVote.abi;

// const defaultFormData = {
//   tokenName: "VoteSphere",
//   ethereumAddress: "0x2ee891078cc2a08c31e494f19E36F772806b1613",
//   arbitrumAddress: "0xC175b8abba483e57d36b7EBd9b4d3fBf630FECCA",
//   optimismAddress: "0x1C04808EE9d755f7B3b2d7fe7933F4Aec8D8Ee0e",
// };

enum FormKeys {
  tokenName = "tokenName",
  ethereumAddress = "ethereumAddress",
  arbitrumAddress = "arbitrumAddress",
  optimismAddress = "optimismAddress",
}

const defaultFormData = {
  tokenName: "",
  ethereumAddress: "",
  arbitrumAddress: "",
  optimismAddress: "",
};

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

  const { destinationChain } = useEquitoVote();

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
          ],
          [
            formData.ethereumAddress,
            formData.arbitrumAddress,
            formData.optimismAddress,
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
      console.error(error);
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

      <Button isDisabled={isAddingToken} onClick={onClickSetTokenData}>
        Add Token
      </Button>

      {isAddingToken && (
        <div className="flex flex-row items-center mt-3">
          <CircularProgress size={20} />
          <div className="ml-4">Adding token to contract registry</div>
        </div>
      )}

      {isSuccess && <div className="mt-3">Token added successfully!</div>}
    </div>
  );
}
