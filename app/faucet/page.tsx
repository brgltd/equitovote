"use client";

import { useState } from "react";
import { Button } from "@/components/button";

const buttonStyles = {
  width: "350px",
  textTransform: "none",
};

export default function FaucetPage() {
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  const onClickRequest = async () => {};

  return (
    <div>
      <h1 className="text-xl font-bold mb-8">
        Request testnet tokens for ease of testing
      </h1>
      <div className="space-y-8">
        <Button onClick={onClickRequest} styles={buttonStyles}>
          Request 1000 VoteSphere Tokens
        </Button>
        <Button onClick={onClickRequest} styles={buttonStyles}>
          Request 1000 MetaQuorum Tokens
        </Button>
        <Button onClick={onClickRequest} styles={buttonStyles}>
          Request 1000 ChainVote Tokens
        </Button>
      </div>
    </div>
  );
}
