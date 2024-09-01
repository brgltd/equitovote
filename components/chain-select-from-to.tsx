"use client";

import { useState } from "react";
import { useSwitchChain } from "wagmi";
import { useEquito } from "../providers/equito-provider";
import { chains } from "../utils/chains";
import { toast } from "sonner";

export function ChainSelect({ mode, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const { chain, setChain } = useEquito()[mode];

  const { switchChainAsync } = useSwitchChain();

  const onClickSelectChain = async (chain) => {
    setIsOpen(false);
    if (mode === "from") {
      try {
        await switchChainAsync({ chainId: chain.definition.id });
        setChain(chain);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message.split("\n")[0]
            : "Failed to switch chain";
        toast.error(message);
      }
    } else {
      setChain(chain);
    }
  };

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Select chain</button>
      {isOpen && (
        <div>
          <ul>
            {chains.map((item) => (
              <li
                key={item.chainSelector}
                onClick={() => onClickSelectChain(item)}
              >
                <img
                  src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${item.img}.png`}
                  width={24}
                  height={24}
                  className="rounded-full"
                  alt={`chain-${item.chainSelector}`}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
