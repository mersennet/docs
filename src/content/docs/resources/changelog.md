---
title: "Changelog"
---

Notable milestones and updates for the Mersennet ecosystem.

---

## September 2026

### Open Validator Set, Snapshot Sync, Verified Node Runners

- **Permissionless validator registration** from block 1,348,200: `registerValidator` on the staking precompile with 1,000 MRSN self-stake and a node-key proof; the top 12 by self + delegated stake form the active set at every hourly epoch; jailing for missed slots (no slashing), exits with ~4 h unbonding, key rotation. One-click registration on the terminal's staking page. New RPCs `mersennet_validatorSet`, `mersennet_nodeIdentity`.
- **Fork choice by finality**: a node that applied a block finality later overruled rolls back and follows the canonical chain automatically. Large blocks are delivered over TCP (UDP gossip could not carry blocks above ~25 transactions), and block-sync rotates peers.
- **Snapshot bootstrap**: fresh installs restore a signed, SHA-256-verified state snapshot and are in sync in about a minute instead of replaying the chain. Signed release bundles (ed25519) and the `mersennet-check` health tool.
- **Verified node runners**: a node signs its operator's wallet; verification is automatic within ~10 minutes; 500 points a day; verified nodes appear on the explorer's Network page.
- Second public RPC node with automatic failover; state snapshots every 6 hours with snapshot-based auto-heal on the fleet.
- **Rewards to the operator wallet** from block 1,440,000 (~2026-09-16 13:15 UTC): a validator's block reward is credited to the wallet that registered it instead of the node key. **Large transactions over TCP**: transactions that do not fit a UDP datagram (contract deployments near the 24 KB code limit) are delivered peer-to-peer like large blocks. Node builds report their git sha (`Mersennet/0.7.0-3e4874e`).

## August 2026

### Fresh Genesis + Feature Release (testnet reset)

A coordinated testnet re-genesis shipping the largest feature batch since the consensus overhaul:

- **Delegated staking live** via the native staking precompile (`0x…0400`): `delegate`, `undelegate`, `claimRewards`, `withdrawUnbonded`, with per-validator commission and F1 reward accounting
- **Permissionless market listing**: anyone can call `createMarket(symbol, tickSize, lotSize)` on the CLOB precompile for a 100 MRSN listing fee
- **New order flags**: post-only and good-till-date (on-chain expiry) time-in-force, alongside GTC/IOC/FOK
- **Multi-collateral margin**: registered tokens (USDC live) accepted as margin collateral alongside native MRSN, with per-asset collateral weights
- **New RPC read methods**: `mersennet_orders_getMarkets`, `mersennet_orders_getAccount`, `mersennet_orders_getCollateralAssets`, `mersennet_orders_getTokenCollateral`, and the `mersennet_staking_*` family
- **Node hosting release**: canonical `networks/testnet` artifacts (genesis config, one-command install script, systemd unit), public bootnodes, and a full [Run a Node](/validators/run-a-node/) guide
- **Sync performance fix**: initial block sync improved from ~3 to ~450 blocks/s
- Foundation contracts redeployed at the **same addresses** (same deployer nonces)

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
