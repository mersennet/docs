---
title: "Test the Network"
description: "The one-page guide to the Mersennet public testnet: get MRSN, trade on the native order book, run a node, become a validator, delegate, build, and earn points — every part is open to test."
---

Everything on the Mersennet testnet is open to anyone: trading, staking, the validator set, node running, points. This page is the map. Each step takes minutes, links go to the detailed guide, and nothing here has monetary value — it is a test network that may be reset.

| I want to… | Time | Needs | Go |
|---|---|---|---|
| Get testnet MRSN | 1 min | a wallet | [1. Faucet](#1-get-testnet-mrsn) |
| Trade perpetuals on the on-chain order book | 5 min | MRSN | [2. Trade](#2-trade) |
| Run a full node | 5 min | a Linux server | [3. Run a node](#3-run-a-node) |
| Produce blocks as a validator | 5 min after step 3 | 1,000 MRSN | [4. Become a validator](#4-become-a-validator) |
| Earn a share of block rewards without a server | 2 min | MRSN | [5. Delegate](#5-delegate) |
| Deploy a contract | 10 min | Hardhat or Foundry | [6. Build](#6-build) |
| See what my participation earned | — | — | [7. Points](#7-points) |

## 1. Get testnet MRSN

Add the network to your wallet ([Wallet Setup](/getting-started/wallet-setup/) — chain ID `131071`, RPC `https://rpc.mersennet.com`) and claim **1,000 MRSN per hour** at [faucet.mersennet.com](https://faucet.mersennet.com). Mock stablecoins for contract testing are on the same page. Details: [Get Testnet MRSN](/getting-started/faucet/).

## 2. Trade

[trade.mersennet.com](https://trade.mersennet.com) is a perpetuals terminal on the **native order book** (precompile `0x…0100`): deposit MRSN as collateral, place limit or market orders, long or short with leverage. Matching and settlement are atomic on-chain — no sequencer, no off-chain matcher. Market makers quote live prices, so books are usually two-sided. Guide: [Mersennet Trade](/ecosystem/trade/).

## 3. Run a node

One command on any Ubuntu 22.04+ / Debian 12+ server (2 vCPU, 4 GB RAM, 40 GB SSD is enough):

```bash
curl -fsSL https://mersennet.com/downloads/install.sh | sudo bash -s -- --operator 0xYOUR_WALLET
```

The installer verifies the signed release, restores the latest state snapshot and starts a hardened systemd service; the node is in sync in about a minute. `--operator` is your wallet: the node signs a statement naming it, the network verifies your node automatically within about ten minutes, and it appears on the [explorer's Network page](https://explorer.mersennet.com/#/network) with your badge. Check it any time with `mersennet-check`. Guide: [Run a Node](/validators/run-a-node/).

## 4. Become a validator

The validator set is **permissionless** from block 1,348,200 (2026-09-14, ~08:35 UTC). With your node verified, open [trade.mersennet.com/staking](https://trade.mersennet.com/staking) with the operator wallet, choose a self-stake of at least **1,000 MRSN** (one faucet claim) and press **Bond & register**. From the next hourly epoch your node signs blocks and earns block rewards.

- Top **12** by self-stake + delegations are active; the rest are on standby.
- Miss more than **20%** of your leader slots in an epoch and you sit out the next one. Nothing is slashed for downtime.
- Leave with one click; self-stake unbonds in **7,200 blocks (~4 h)**.

Full parameters, lifecycle and the raw precompile calls: [Become a Validator](/validators/become-a-validator/).

## 5. Delegate

No server? Delegate MRSN to any validator on the [staking page](https://trade.mersennet.com/staking): you earn its block rewards minus commission, claim any time, and your stake counts toward its ranking. Undelegating unbonds in ~4 hours. Guide: [Staking](/validators/staking/).

## 6. Build

Mersennet is EVM-equivalent: Hardhat, Foundry, ethers and viem work unchanged. Deploy in ten minutes with the [Hardhat](/developers/quick-start/hardhat/) or [Foundry](/developers/quick-start/foundry/) quick start, call the order book from Solidity ([DeFi integration](/developers/contracts/defi-integration/)), or use the [JSON-RPC](/developers/rpc/methods/) and [SDKs](/developers/sdks/javascript/).

## 7. Points

Season 1 points on [trade.mersennet.com/points](https://trade.mersennet.com/points) track participation: **1 point per $1 traded** and **500 points a day** for each verified node while it is online. Liquidity and referral points are next. The [leaderboard](https://trade.mersennet.com/leaderboard) ranks traders.

## Is it up?

[status.mersennet.com](https://status.mersennet.com/status/mersennet) shows live uptime of the RPC (two public nodes with automatic failover), explorer, faucet, terminal and the snapshot server. Something wrong or confusing? The terminal's [feedback form](https://trade.mersennet.com/feedback) goes straight to the team.
