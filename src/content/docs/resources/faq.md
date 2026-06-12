---
title: "FAQ"
---

# Frequently Asked Questions

## General

### What is Mersennet?

**Mersennet** is a high-performance, EVM-compatible Layer 1 blockchain built for speed, composability, and institutional-grade DeFi. It combines Ethereum's smart contract ecosystem with a **native order matching engine (MersennetOrders)**, enabling atomic cross-domain workflows (EVM + CLOB) in a single transaction. Key features include ~1 second block times, HotStuff-2 BFT Proof-of-Stake consensus, and a 2⁸⁹ − 1 wei (≈618.97M MRSN) supply cap with halving block rewards.

### Is Mersennet EVM compatible?

Yes. Mersennet is fully EVM compatible. You can deploy Solidity contracts without modification using Hardhat, Foundry, or Remix. Standard tooling (ethers.js, wagmi, viem) works out of the box.

### What is the Chain ID?

**131071** (hex: `0x1FFFF`) for Mersennet testnet.

### What is MersennetOrders?

**MersennetOrders** is Mersennet's native central limit order book (CLOB). It's an on-chain matching engine accessible via an EVM precompile, allowing smart contracts to place, cancel, and fill orders atomically in the same transaction. This enables DeFi strategies that combine AMM liquidity with order book execution, something not possible on traditional EVM-only chains.

## Tokens & Faucet

### How do I get testnet tokens?

1. Add Mersennet to your wallet (see [Wallet Setup](/getting-started/wallet-setup)).
2. Use the **Faucet** at [https://faucet.mersennet.com](https://faucet.mersennet.com) to receive testnet MRSN.
3. For mock stablecoins (USDC, USDT, DAI), call the `faucet()` function on each contract; see [Deployed Contracts](/resources/contracts).

### What is the max supply of MRSN?

The supply **cap** is **2⁸⁹ − 1 wei ≈ 618.97M MRSN** (a Mersenne prime) with 18 decimals, a hard protocol ceiling, not the target circulating supply. Block-reward emission follows the halving schedule and converges to **≈ 154.72M MRSN**, well below the cap; the rest of circulating MRSN comes from genesis allocations (ecosystem/grants, foundation, team, sales), with amounts finalized at genesis. See [Tokenomics](/architecture/tokenomics) for details.

### What is WMRSN?

**WMRSN** is the ERC-20 wrapped version of native MRSN. It's required for DEX pairs (e.g., WMRSN/USDC on Mersennet Swap) and DeFi protocols that expect ERC-20 tokens. Wrap with `deposit()` and unwrap with `withdraw()`. Address: `0x079bf1207b51acda83e2e8178344f62a883f8479`.

## Development

### How do I deploy a contract to Mersennet?

Use Hardhat or Foundry with Mersennet as a network. Add the RPC URL `https://rpc.mersennet.com` and Chain ID `131071`. See [Deploy with Hardhat](/developers/quick-start/hardhat) and [Deploy with Foundry](/developers/quick-start/foundry).

### What wallets are supported?

- **Mersennet Wallet**: Native Chrome extension for Mersennet (Chain ID 131071 preconfigured).
- **MetaMask**: Add Mersennet manually via [Wallet Setup](/getting-started/wallet-setup).
- **Mersennet Wallet Mobile**: React Native wallet (APK available).

Any EIP-1193–compatible wallet can connect once Mersennet is added as a custom network.

### Is there a bridge?

A cross-chain bridge is planned (Tier 3 in the roadmap). For now, testnet assets exist only on Mersennet. Bridge infrastructure is documented in the whitepaper for future deployment.

## Network

### Where is the block explorer?

[https://explorer.mersennet.com](https://explorer.mersennet.com). View blocks, transactions, addresses, and contract interactions there.

### Where is the RPC endpoint?

- **HTTP:** `https://rpc.mersennet.com`
- **WebSocket:** `wss://rpc.mersennet.com` (may not be enabled on all nodes)

### What is the block time?

Approximately **1 second** per block.

## Ecosystem

### What is Mersennet Swap?

Mersennet Swap is the native AMM/DEX on Mersennet, a Uniswap V2 fork with 0.3% swap fee. See [Mersennet Swap DEX](/ecosystem/swap).

### What is Mersennet Lend?

Mersennet Lend is an Aave-style lending/borrowing protocol. Contracts are built and ready for deployment. See [Mersennet Lend Lending](/ecosystem/lend).

### What is Mersennet NFTs?

Mersennet NFTs is a Seaport-based NFT marketplace supporting ERC-721 and ERC-1155. See [Mersennet NFTs NFT Marketplace](/ecosystem/nfts).

---

Have more questions? Check the [Getting Started](/getting-started/overview) guides or open an issue on [GitHub](https://github.com/mersennet/mersennet).
