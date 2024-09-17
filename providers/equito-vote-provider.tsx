import { useRouter } from "@/hooks/use-router";
import { Chain, destinationChain, supportedChainsMap } from "@/utils/chains";
import { config } from "@/utils/wagmi";
import { UseQueryResult } from "@tanstack/react-query";
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { Address } from "viem";
import { useAccount, useChainId } from "wagmi";

type EquitoVoteContext =
  | {
      sourceChain: Chain;
      setSourceChain: Dispatch<SetStateAction<Chain>>;
      sourceRouter: UseQueryResult<Address, Error>;
      destinationChain: Chain;
      destinationRouter: UseQueryResult<Address, Error>;
      isClient: boolean;
      userAddress: Address | undefined;
      isToastOpen: boolean;
      setIsToastOpen: Dispatch<SetStateAction<boolean>>;
      toastMessage: string;
      setToastMessage: Dispatch<SetStateAction<string>>;
    }
  | undefined;

const equitoVoteContext = createContext<EquitoVoteContext>(undefined);

export const EquitoVoteProvider = ({ children }: PropsWithChildren<object>) => {
  const [sourceChain, setSourceChain] = useState<Chain>(null!);
  const [isClient, setIsClient] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { address: userAddress } = useAccount();

  const chainId = useChainId();
  console.log("chainId");
  console.log(chainId);

  console.log("address");
  console.log(userAddress);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const connectedChain = supportedChainsMap[chainId];
    setSourceChain(connectedChain);
  }, [chainId]);

  const sourceRouter = useRouter({ chainSelector: sourceChain?.chainSelector });
  const destinationRouter = useRouter({
    chainSelector: destinationChain.chainSelector,
  });

  return (
    <equitoVoteContext.Provider
      value={{
        sourceChain,
        setSourceChain,
        sourceRouter,
        destinationChain,
        destinationRouter,
        isClient,
        userAddress,
        isToastOpen,
        setIsToastOpen,
        toastMessage,
        setToastMessage,
      }}
    >
      {children}
    </equitoVoteContext.Provider>
  );
};

export const useEquitoVote = () => {
  const context = useContext(equitoVoteContext);
  if (!context) {
    throw new Error("useEquitoVote must be used within a EquitoVoteProvider");
  }
  return context;
};
