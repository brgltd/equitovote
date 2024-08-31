"use client";

import { useEffect, useRef, useState } from "react";

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

export default function HomePage() {
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const proposalTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    proposalTitleRef.current?.focus();
  }, []);

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

      <button>Create Proposal</button>
    </div>
  );
}
