"use client";

import { useState } from "react";
import { useSwitchChain } from "wagmi";
import { Chain, supportedChains } from "../utils/chains";
import { toast } from "sonner";

export function ChainSelect({ setSourceChain }: any) {
  const [isOpen, setIsOpen] = useState(false);

  const { switchChainAsync } = useSwitchChain();

  const onClickSelectChain = async (chain: Chain) => {
    setIsOpen(false);
    try {
      await switchChainAsync({ chainId: chain.definition.id });
      setSourceChain(chain);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.split("\n")[0]
          : "Failed to switch chain";
      toast.error(message);
    }
  };

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Select chain</button>
      {isOpen && (
        <div>
          <ul>
            {supportedChains.map((item) => (
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
