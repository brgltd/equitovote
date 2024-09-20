# Equito Vote

## Live

https://equitovote.vercel.app/

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

Also note the proposal data effectivly gets saved on arbitrum (arbitrum is used as the destination chain and it stores the number of votes and other metadata).

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
