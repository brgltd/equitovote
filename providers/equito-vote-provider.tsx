import { useRouter } from "@/hooks/use-router";
import { Chain, destinationChain } from "@/utils/chains";
import { UseQueryResult } from "@tanstack/react-query";
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from "react";

type EquitoVoteContext =
  | {
      sourceChain: Chain;
      setSourceChain: Dispatch<SetStateAction<Chain>>;
      sourceRouter: UseQueryResult<`0x${string}`, Error>;
      destinationRouter: UseQueryResult<`0x${string}`, Error>;
    }
  | undefined;

const equitoVoteContext = createContext<EquitoVoteContext>(undefined);

export const EquitoVoteProvider = ({ children }: PropsWithChildren<object>) => {
  const [sourceChain, setSourceChain] = useState<Chain>(null!);

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
        destinationRouter,
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
