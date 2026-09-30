---
title: "What is Mersennet?"
description: "What Mersennet is: an EVM Layer 1 with a native on-chain order book, leader-gated BFT finality in ~2 s, and account-level privacy at the privacy fork."
---

**Mersennet** is an EVM-compatible Layer 1 with two things most chains don't have: a **native order matching engine (MersennetOrders)** built into the execution layer, and **account-level privacy** with verifiable state. Your Solidity contracts deploy unchanged — and they can place, fill, and cancel orders on a real order book atomically, inside the same transaction.

## Why Mersennet?

| Feature | Mersennet |
|---------|-------------|
| **EVM Compatibility** | Deploy existing Solidity contracts without modification |
| **Block Time** | ~2 seconds with immediate BFT finality |
| **Native CLOB** | MersennetOrders, on-chain order matching with EVM composability |
| **Account-level privacy** | Shielded accounts, ZK risk checks, and shielded orders (privacy hard fork) |
| **Verifiable state** | State transitions proven with SP1; designed for Groth16 verification on Ethereum (the bridge verifier is not yet deployed) |
| **Consensus** | Leader-gated BFT proof-of-stake — one elected producer per block, finalized by a 2/3-stake vote quorum |
| **Token** | MRSN (18 decimals, 2⁸⁹ − 1 wei ≈ 618.97M supply cap) |
| **Implementation** | Rust-based node for reliability and performance |

## Key Capabilities

- **EVM Compatibility**: Use Hardhat, Foundry, Remix, and all standard Ethereum tooling. Your contracts work as-is.
- **Fast Finality**: ~2 second blocks, finalized by a 2/3-stake vote quorum — no confirmations to wait for and no reorgs.
- **MersennetOrders**: A native central limit order book (CLOB) accessible via EVM precompile, enabling DeFi strategies that combine smart contracts with order matching in a single transaction.
- **Account-level privacy** (privacy hard fork, not yet active): shielded accounts will conceal balances, positions and order flow, with zero-knowledge risk checks in place of public liquidations. Today's testnet is transparent, with keeper liquidations from block 1,605,600. See [Privacy on Mersennet](/privacy/overview/).
- **Verifiable state**: Every block's state transition is proven with SP1 (development-prover mode on the current testnet), designed to be wrapped into a Groth16 proof an Ethereum contract can verify, so the chain is checkable from a succinct proof.
- **BFT Proof-of-Stake**: Deterministic leader rotation with timeout failover, signed finality votes from every validator, benching and escalating jail (1, 2, 4, 8, 16, 24 epochs) for missed leader slots, and slashing only for equivocation.
- **Mersenne-prime supply cap**: A hard ceiling of 2⁸⁹ − 1 wei (≈618.97M MRSN), with halving block rewards and structured tokenomics. Block-reward emission converges to ≈154.72M MRSN, well below the cap.

## Built for Developers

Mersennet is designed for builders. Whether you're deploying a simple ERC-20, building a DEX, or integrating lending protocols, the same tools and patterns you know from Ethereum apply. The network is live on **testnet** (Chain ID 131071) with a block explorer, faucet, and deployed infrastructure ready for development.

## What's Next?

| Step | Link |
|------|------|
| 0. The one-page map of everything you can test | [Test the Network](/getting-started/test-the-network/) |
| 1. Add the network to your wallet | [Wallet Setup](/getting-started/wallet-setup/) |
| 2. Get testnet MRSN from the faucet | [Faucet](/getting-started/faucet/) |
| 3. Send your first transaction | [First Transaction](/getting-started/first-transaction/) |
| 4. Deploy a smart contract | [Hardhat Quick Start](/developers/quick-start/hardhat/) |
| 5. Explore the architecture | [Consensus](/architecture/consensus/) · [Tokenomics](/architecture/tokenomics/) |
| 6. Learn about privacy | [Privacy on Mersennet](/privacy/overview/) |
| 7. Run a node (one command, in sync in a minute) and earn points | [Run a Node](/validators/run-a-node/) |
| 8. Become a validator with 1,000 MRSN | [Become a Validator](/validators/become-a-validator/) |
| 9. Read the whitepaper | [Whitepaper](/whitepaper/) |
