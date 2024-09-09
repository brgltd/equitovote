"use client";

import { useState } from "react";

const defaultFormData = {
  tokenName: "",
  ethereumAddress: "",
  arbitrumAddress: "",
  optimismAddress: "",
};

export default function SetTokenDataPage() {
  const [formData, setFormData] = useState(defaultFormData);

  return (
    <div>
      <div>
        <label htmlFor="token-name">token name</label>
        <input
          type="text"
          id="token-name"
          value={formData.tokenName}
          onChange={(e) =>
            setFormData({ ...formData, tokenName: e.target.value })
          }
          className="text-black"
        />
      </div>

      <div>
        <label htmlFor="ethereum-address">ethereum address</label>
        <input
          type="text"
          id="ethereum-address"
          value={formData.ethereumAddress}
          onChange={(e) =>
            setFormData({ ...formData, ethereumAddress: e.target.value })
          }
          className="text-black"
        />
      </div>

      <div>
        <label htmlFor="arbitrum address">arbitrum address</label>
        <input
          type="text"
          id="arbitrum-address"
          value={formData.arbitrumAddress}
          onChange={(e) =>
            setFormData({ ...formData, arbitrumAddress: e.target.value })
          }
          className="text-black"
        />
      </div>

      <div>
        <label htmlFor="optimism-address">optimism address</label>
        <input
          type="text"
          id="optimism-address"
          value={formData.optimismAddress}
          onChange={(e) =>
            setFormData({ ...formData, optimismAddress: e.target.value })
          }
          className="text-black"
        />
      </div>
    </div>
  );
}
