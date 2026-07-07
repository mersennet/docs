---
title: "Changelog"
---

Notable milestones and updates for the Mersennet ecosystem.

---

## July 2026

### Consensus & Correctness Overhaul (testnet reset)

The largest protocol upgrade to date, requiring a coordinated testnet re-genesis:

- **Real networked BFT**: leader-gated block production (one elected validator per height, timeout failover), signed finality votes gossiped between nodes, 2/3-stake quorum finality
- **Content-committing block hashes**: every block hash binds `parent_hash`, `timestamp`, transaction root, state root, and receipts root; imports verify the hash-link
- **Standard Ethereum transactions**: EIP-155 / typed-envelope RLP is canonical — MetaMask and ethers.js work out of the box, and the wallet-computed hash is the on-chain hash
- **Consensus-routed CLOB**: every order, cancel, and collateral deposit is a mined precompile transaction, so the order book is identical on every node and fills are on-chain events
- **SP1 proofs on every block** (development prover), gossiped and verified across the network, labeled honestly in the explorer

### Trading Goes Live End-to-End

- [trade.mersennet.com](https://trade.mersennet.com): live order books on 5 perp markets (MRSN, BTC, ETH, SOL, ARB), real trade tape, candles built from on-chain fills, realistic 8-hour funding
- Wallet flow verified end-to-end: faucet → signed transfer → collateral deposit → order resting on-chain
- Foundation contracts redeployed on the fresh chain: Multicall3, WMRSN, MockUSDC/USDT/DAI (see [Deployed Contracts](/resources/contracts))

### Explorer & Docs

- Explorer serves pruned history from its indexer, labels development proofs, and decodes CLOB trade events in every block
- Docs updated for consensus-routed orders, current contract addresses, and the live network parameters

---

## March 2026

### DeFi Experiments (retired)

Uniswap V2- and V3-style AMM deployments were trialed on the previous testnet chain. They were retired in the July 2026 reset — trading now happens on the native [MersennetOrders CLOB](/architecture/order-book).

### Block Explorer Upgraded

- Token balance display for addresses
- ABI decoding for verified contract interactions
- Improved contract verification UI

---

## February 2026

### Testnet Launch

Mersennet testnet launched with BFT proof-of-stake consensus.

- 4-validator network plus a public RPC full node
- Chain ID 131071, EVM Shanghai compatibility
- JSON-RPC and WebSocket endpoints live
- Testnet faucet deployed at [https://faucet.mersennet.com](https://faucet.mersennet.com)
- Foundation contracts deployed: Multicall3, WMRSN, MockUSDC, MockUSDT, MockDAI

---

## January 2026

### Documentation Site Launched

- Getting Started guides (network info, wallet setup, faucet, first transaction)
- Developer documentation (Hardhat, Foundry, ERC-20, contract integration)
- Validator guides (run a node, staking, monitoring)
- Architecture deep-dives (consensus, node architecture, EVM compatibility, MersennetOrders)
- Live at [https://docs.mersennet.com](https://docs.mersennet.com)
