import { useState } from "react";
import { Chain } from "@/utils/chains";
import { useRouter } from "./use-router";
import { destinationChain } from "@/utils/chains";

export function useChain() {
  const [sourceChain, setSourceChain] = useState<Chain>(null!);

  const sourceRouter = useRouter({ chainSelector: sourceChain?.chainSelector });
  const destinationRouter = useRouter({
    chainSelector: destinationChain.chainSelector,
  });

  return { sourceChain, setSourceChain, sourceRouter, destinationRouter };
}
