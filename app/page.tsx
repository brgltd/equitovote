"use client";

import { useEffect, useRef, useState } from "react";
import { addHours } from "date-fns";

const ARBITRUM_CHAIN_SELECTOR = 1004;

interface FormData {
  title: string;
  description: string;
  durationHours: string;
}

interface CreateProposalArgs {
  destinationChainSelector: number;
  endTimestamp: number;
  erc20: string;
  title: string;
  description: string;
}

const defaultFormData = {
  title: "",
  description: "",
  durationHours: "",
};

function buildCreateProposalArgs(formData: FormData): CreateProposalArgs {
  console.log(new Date());
  const endTimestamp = Math.floor(
    addHours(new Date(), Number(formData.durationHours)).getTime() / 1000,
  );
  console.log(endTimestamp);
  return {
    destinationChainSelector: ARBITRUM_CHAIN_SELECTOR,
    endTimestamp: 0,
    erc20: "",
    title: formData.title,
    description: formData.description,
  };
}

export default function HomePage() {
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const proposalTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    proposalTitleRef.current?.focus();
  }, []);

  const onClickCreateProposal = async () => {
    const createProposalArgs = buildCreateProposalArgs(formData);
  };

  return (
    <div>
      <div>Proposal</div>

      <div>
        <label htmlFor="title">title</label>
        <input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          ref={proposalTitleRef}
          className="text-black"
        />
      </div>

      <div>
        <label htmlFor="description">description</label>
        <input
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="text-black"
        />
      </div>

      <div>
        <label htmlFor="duration">duration in hours</label>
        <input
          type="number"
          id="duration"
          value={formData.durationHours}
          onChange={(e) =>
            setFormData({ ...formData, durationHours: e.target.value })
          }
          className="text-black"
        />
      </div>

      <button onClick={onClickCreateProposal}>Create Proposal</button>
    </div>
  );
}
