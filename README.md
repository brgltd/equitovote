# Equito Vote

## Live

https://equitovote.vercel.app/

## Video

https://drive.google.com/file/d/1EukNBSQMFP46ySoMWVzJadlqoFKa05S2/view

## Overview

A significant issue in DAO voting today is that bridges do not transfer governance votes tied to tokens utilizing the ERC20Votes extension. As highlighted in the [Tally documentation](https://docs.tally.xyz/user-guides/bridge-providers), this limitation poses challenges for DAO users and prevents user adoption.

This project proposes a solution to solve this issue by using the Equito SDKs and therefore leverage high performance cross chain message communication.

## Highlights

- Create a DAO proposal in any EVM chain.
- Vote from any EVM chain.
- Compatible with ERC20Votes to avoid locking/unclocking tokens.
- Optimized FE with static generation.
- Mobile friendly UI.

## Notes

During the Equito Builder Program, we've deployed on ethereum, arbitrum, optimism, base and blast.

The proposal data effectivly gets saved on arbitrum (arbitrum is used as the destination chain and it stores the number of votes and other metadata).

We are using the ERC20Votes extension to allow snapshot voting. The app is meant to be used with these tokens. Popular DeFi protocols used these tokens for governance, e.g. uniswap, aave, ens, yearn etc. Since some of these tokens are difficult to find on testnets, we've created 3 tokens (VoteSphere, MetaQuorum and ChainLight) and a faucet, to allow anyone to create proposals and vote on proposals without hassle during the hackathon testing period.

Main contract is located at: https://github.com/brgltd/equitovote/blob/main/src/EquitoVote.sol

## How to run the project locally

```bash
curl -L https://foundry.paradigm.xyz | bash

forge build

npm install

npm run dev
```

## Contact

brgltdxyz@gmail.com
