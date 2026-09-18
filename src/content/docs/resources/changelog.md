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
- **First outside validator** registered and produced its first epochs on 15 Sep; the incident it exposed (a restarted node forgot the open set until the next boundary) is fixed: the active set is restored on startup. **Every block is also pushed over TCP** (UDP fragments can be dropped by some providers). **Leader failover round 8 s** (was 19 s). **Escalating jail** for consecutive offences from block 1,569,600 (~19 Sep 16:00 UTC): 1, 2, 4, 8, 16, 24 epochs.
- **Rewards to the operator wallet** from block 1,440,000 (~2026-09-16 13:15 UTC): a validator's block reward is credited to the wallet that registered it instead of the node key. **Large transactions over TCP**: transactions that do not fit a UDP datagram (contract deployments near the 24 KB code limit) are delivered peer-to-peer like large blocks. Node builds report their git sha (`Mersennet/0.7.0-3e4874e`). **Every node proposes and votes while it is in the active set** — a registered community node joins at the epoch boundary without a restart or mode switch. **Compact gossip encoding** from block 1,440,000 (base64 payloads, ~2.8× less bandwidth; nodes older than release `9e3a508` cannot follow past that height — re-run the installer).
- **Trade terminal, 17 Sep**: Stop, Stop-limit, Trailing stop and TWAP orders (armed in the browser, executed as signed orders when triggered), Scale ladders; referral points (10% of referee trading points, wallet-signed attribution) and a weekly sprint (top 3 by volume, 3,000 / 2,000 / 1,000 bonus points); leaderboard Points board; truthful fee display (no trading fees on the testnet); self-hosted fonts, static announcement line, AA-contrast labels, phone-sized touch targets and a full-height mobile order sheet; `/api/v1/stats` aggregates cached (was 0.9–1.9 s per call). Market-maker and taker bots tuned so candles no longer span three ticks; automated test markets hidden from the market list.
- **18 Sep release — active from block 1,605,600 (~21 Sep 16:00 UTC)**: **Settlement.** One collateral unit becomes **one MRSN** (`depositCollateral(100)` escrows 100 MRSN; balances from before the switch are divided by 10¹⁸ once — they were wei-backed units), **realized PnL is settled into collateral at every fill** (previously it was tracked per position but never paid: a profitable close left collateral unchanged), **10% initial margin** (10× max) and **5% maintenance with keeper liquidations** — anyone can call `liquidate(address)`; the account's positions are closed on the book, its PnL settles, a 1% fee on the closed notional is split between the keeper and the insurance fund, and the fund covers what the collateral could not (`mersennet_orders_getLiquidatable` feeds keepers; the network runs one). Reducing a position is always allowed, however deep under water. **Self-trade prevention** (your own resting order is cancelled rather than filled — no printing volume against yourself), and a `badDebt` counter for losses that exceed an account's collateral. New RPC `mersennet_orders_getProtocol` reports every CLOB switch and parameter. The maker vault was redeployed for the new units (`0xe77F…7725`). Also: the CLOB and staking precompiles authorise on the **call frame's caller** (`msg.sender`) instead of the transaction origin. Found while wiring the maker vault: a contract calling the precompile acted as whoever sent the transaction, so contracts could not own order-book accounts — and any contract a user interacted with could have placed orders (or, after 19 Sep, granted an agent) on that user's account. From the switch, contracts hold their own collateral and positions and the vault's deposits open. `mersennet_orders_getAgents` reports `frameCallerHeight`. Same-day app work: order-book grouping follows the market tick, price inputs step by the tick, "Place your first order" prefills a 1-unit market buy, LP points on the Points page and leaderboard, vault position on the portfolio, explorer depth refreshes live, validator tables show node builds, client-side errors are reported to ops.
- **17 Sep release — active from block 1,569,600 (~19 Sep 16:00 UTC)**: **Agent delegation** on the CLOB precompile — `setAgent(agent, expiresAtBlock)` lets a second key place and cancel orders *as* the granting account (never deposit or withdraw); the terminal's one-click trading now runs on it, so orders, positions and history stay on your main wallet while a browser key signs silently (`mersennet_orders_getAgents`). **Finer ticks**: MRSN, SOL and ARB move to `priceScale` 100 ($0.01 ticks); resting orders, positions and last prices are rescaled in place at the switch and `mersennet_orders_getMarkets` exposes `priceScale`. **Maker vault** (`0x2ccc…5284`): pool MRSN behind the market maker, shares at NAV, LP points (0.1 per MRSN-day), withdraw any time from the free reserve. **Launch dashboard** endpoint `/api/v1/stats/launch` (humans vs bots per day). Release notes and switch reminders are posted to Telegram automatically.
- **Benching (16 Sep build, active from block 1,569,600)**: a validator that misses 3 leader slots in an epoch leaves the leader rotation until the boundary — the network spends three failover rounds on a dead leader instead of an hour of them; it keeps voting and its stake, and the boundary jails it as before. **Self-healing nodes**: a node whose head has not moved for five minutes while the network is 60+ blocks ahead exits and is restarted by systemd (`watchdog` config section; never fires on a network-wide halt). The redb storage backend now persists the validator registry like sled. The staking page and `mersennet-check` flag a node that is behind the current release, with the next protocol switch height.

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
