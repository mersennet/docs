---
title: "FAQ"
---

# Frequently Asked Questions

## General

### What is Mersennet?

**Mersennet** is the private, verifiable network: an EVM-compatible Layer 1 with a **native on-chain order book (MersennetOrders)** that contracts can place and fill orders on atomically in one transaction, every block proven with SP1, and account-level privacy arriving at the privacy hard fork. Key features include ~2 second blocks with immediate BFT finality, leader-gated Proof-of-Stake consensus, and a 2⁸⁹ − 1 wei (≈618.97M MRSN) supply cap with halving block rewards.

### Is Mersennet EVM compatible?

Yes. Mersennet is fully EVM compatible. You can deploy Solidity contracts without modification using Hardhat, Foundry, or Remix. Standard tooling (ethers.js, wagmi, viem) works out of the box.

### What is the Chain ID?

**131071** (hex: `0x1FFFF`) for Mersennet testnet.

### What is MersennetOrders?

**MersennetOrders** is Mersennet's native central limit order book (CLOB). It's an on-chain matching engine accessible via an EVM precompile, so smart contracts can deposit collateral, place, cancel, and fill orders atomically in the same transaction — strategies like on-chain market making and atomic arbitrage that are impossible when the order book lives off-chain.

## Tokens & Faucet

### How do I get testnet tokens?

1. Add Mersennet to your wallet (see [Wallet Setup](/getting-started/wallet-setup)).
2. Use the **Faucet** at [https://faucet.mersennet.com](https://faucet.mersennet.com) — 1,000 MRSN (+1 for gas) per address per hour, plus one-click claims of 10,000 MockUSDC/USDT/DAI.
3. Contracts and scripts can also call the public `faucet()` function on each mock token directly; see [Deployed Contracts](/resources/contracts).

### What is the max supply of MRSN?

The supply **cap** is **2⁸⁹ − 1 wei ≈ 618.97M MRSN** (a Mersenne prime) with 18 decimals, a hard protocol ceiling, not the target circulating supply. Block-reward emission follows the halving schedule and converges to **≈ 154.72M MRSN**, well below the cap; the rest of circulating MRSN comes from genesis allocations (ecosystem/grants, foundation, team, sales), with amounts finalized at genesis. See [Tokenomics](/architecture/tokenomics) for details.

### What is WMRSN?

**WMRSN** is the ERC-20 wrapped version of native MRSN, for DeFi protocols that expect ERC-20 tokens. Wrap with `deposit()` and unwrap with `withdraw()`. Address: `0x5bBF04528469591280D36D46209c7CCD5a68a798` (see [Deployed Contracts](/resources/contracts) for the always-current list).

## Development

### How do I deploy a contract to Mersennet?

Use Hardhat or Foundry with Mersennet as a network. Add the RPC URL `https://rpc.mersennet.com` and Chain ID `131071`. See [Deploy with Hardhat](/developers/quick-start/hardhat) and [Deploy with Foundry](/developers/quick-start/foundry).

### What wallets are supported?

Any EIP-1193–compatible wallet — MetaMask, Rabby, Frame, Rainbow, and others — once Mersennet is added as a custom network (see [Wallet Setup](/getting-started/wallet-setup)). Transactions are standard EIP-155 signed transactions: the hash your wallet shows you is the hash on chain, and hardware wallets work through their usual integrations.

### Is there a bridge?

A cross-chain bridge is planned for after the privacy hard fork and is not live; the Groth16 verifying key for the Ethereum side is in progress. For now, testnet assets exist only on Mersennet. The design is in the whitepaper.

## Network

### Where is the block explorer?

[https://explorer.mersennet.com](https://explorer.mersennet.com). View blocks, transactions, addresses, and contract interactions there.

### Where is the RPC endpoint?

- **HTTP:** `https://rpc.mersennet.com`
- **WebSocket:** `wss://rpc.mersennet.com` — `eth_subscribe` streams (new heads, logs, pending transactions); send regular calls over HTTPS. See [Network Info](/getting-started/network-info/).

### What is the block time?

Approximately **2 seconds** per block on the current testnet. Blocks are final as soon as a 2/3-stake vote quorum lands — there is no confirmation depth to wait for.

### Can I run a node?

Yes, in one command on any Ubuntu 22.04+/Debian 12+ server: `curl -fsSL https://mersennet.com/downloads/install.sh | sudo bash`. Fresh nodes start from a signed state snapshot and are in sync in about a minute. See [Run a Node](/validators/run-a-node/).

### Can I become a validator?

Yes. The set is open since block 1,348,200: run a node with `--operator 0xYOUR_WALLET`, then bond at least 1,000 MRSN on the [staking page](https://trade.mersennet.com/staking) — one click. You produce blocks from the next hourly epoch. Details on [Become a Validator](/validators/become-a-validator/).

### What are points and how do node runners earn them?

Points track testnet participation on [trade.mersennet.com/points](https://trade.mersennet.com/points): 1 point per $1 traded, **500 points a day** for running a verified node, 10% of a referee's trading points, the weekly sprint bonus and 0.1 point per MRSN-day in the Maker Vault. Verification of a node is automatic within about ten minutes of it being online with an operator address configured. Points have no monetary value and promise no token or airdrop; farming them forfeits them — see [Testnet Policies](/resources/testnet-policies/).

### Does testnet MRSN have value? Will the testnet be reset?

No, and possibly. Testnet MRSN and everything built on it exist to exercise the software and cannot be redeemed; anyone selling testnet MRSN is running a scam. The chain may be reset with at least 48 hours' notice when a defect cannot be carried forward. [Testnet Policies](/resources/testnet-policies/) has the full statement, including rate limits, data retention and how incidents are communicated.

## Ecosystem

### What is Mersennet Trade?

Mersennet Trade is the perpetuals trading terminal built on the on-chain CLOB precompile (`MersennetOrders`): explicit bid/ask price discovery, limit and market orders, every action a signed transaction. Its spot page is an off-chain preview for UX testing, not on-chain trading. See [Mersennet Trade](/ecosystem/trade).

## Security

### How do I report a vulnerability? {#security}

Email **security@mersennet.com** (or message an admin in the [Telegram group](https://t.me/Mersennet) and ask for a private channel). Please include steps to reproduce, the affected component (node, precompile, terminal, API, explorer, faucet) and, for chain issues, the block height. We acknowledge within 48 hours and keep you informed until the fix ships; credit in the changelog is yours if you want it. Do not test against other users' funds or run denial-of-service traffic — this is a public testnet, but people are using it. Every public web hostname (mersennet.com, trade, explorer, faucet, docs, status) publishes the same contact at `/.well-known/security.txt`.

---

Have more questions? Check the [Getting Started](/getting-started/overview) guides. Node operators: [Run a Node](/validators/run-a-node/) installs a node in one command and [Become a Validator](/validators/become-a-validator/) explains registration — no application needed. Questions and discussion: the official Telegram chat [t.me/Mersennet](https://t.me/Mersennet). Bug reports and product feedback go through the [feedback page in the trade terminal](https://trade.mersennet.com/feedback).
