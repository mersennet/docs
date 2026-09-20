---
title: "Glossary"
description: "Every Mersennet-specific term, from notes and nullifiers to viewing keys and FBA, defined in one page."
---

Privacy systems come with vocabulary. Every Mersennet-specific term, defined
once, linked everywhere.

## Shielded accounts

**Note**: The unit of shielded value: a private record `(owner, asset, amount, randomness)`. Your shielded balance is the sum of your unspent notes. Notes never appear on-chain in the clear; only their commitments do.

**Commitment**: A Poseidon hash of a note, inserted into the global commitment tree. It proves the note exists without revealing anything about it.

**Commitment tree**: A Merkle tree (Poseidon-2 over BN254) containing every note commitment ever created. Spend proofs reference a recent tree root, so the chain keeps a 64-block ring of recent roots to give clients a proving window.

**Nullifier**: A unique tag derived from a note and its owner's key, published when the note is spent. The chain rejects duplicate nullifiers (that's double-spend prevention), but a nullifier cannot be linked back to its note.

**Shield / Unshield** (privacy hard fork, not yet active): Moving value between transparent EVM balances and shielded notes, via the precompile at `0x0201`. Shielding debits your public balance and mints a commitment; unshielding consumes a note (publishing its nullifier) and credits a public address. These are the only moments value visibly crosses the boundary.

**Viewing key**: The key pair that can *see* your notes without being able to *spend* them. Spending requires the separate spend key. Viewing keys make [selective disclosure](/privacy/selective-disclosure/) possible.

**Grant**: A scoped, expiring delegation of read access derived from your viewing key, e.g. "balances and positions, until 2026-12-31" for an auditor. Enforced by `-32604` on out-of-scope reads.

**Note scanning**: How a wallet finds its money: trial-decrypting encrypted note payloads in each block with the viewing key, locally. The chain never learns which notes are yours. See [Note Scanning](/privacy/note-scanning/).

**Migration note**: At the privacy hard fork, every transparent balance is deterministically converted into one shielded note per account. The derivation labels (`MersennetChain-MigrationRho/Psi`) let wallets recognize their migrated funds.

## Order book

**MersennetOrders**: The chain-native central limit order book (CLOB), exposed to Solidity at precompile `0x0100`. Matching is price-time priority and happens in consensus, with no off-chain sequencer.

**Precompile**: A built-in contract at a fixed address, implemented in the node rather than in EVM bytecode. The order book lives at `0x…0100` and staking at `0x…0400`; wallets and contracts call them like any other contract.

**Mersennet Trade (the terminal)**: The trading terminal at [trade.mersennet.com](https://trade.mersennet.com): order books, positions, points, the maker vault and staking, all over the precompiles. Every order it places is a wallet-signed transaction. See [Mersennet Trade](/ecosystem/trade/).

**Agent key**: A second key an account grants on-chain with `setAgent(agent, expiresAtBlock)` on the order-book precompile. It can place and cancel orders as the granting account but never deposit or withdraw; the terminal's one-click trading uses a browser-held agent key. Active from block 1,569,600.

**Maker Vault**: The contract at `0xe77F94c4Bf7D6d2E2371aFdE440a0b9b8a567725` that pools MRSN behind the market maker quoting every market. Deposits mint `mvMRSN` shares at NAV and earn 0.1 LP point per MRSN per day; deposits open at block 1,605,600.

**Atomic composability**: A contract can place an order and read its fill in the *same transaction*, because the order book is a precompile sharing state with the EVM. This is the property asynchronous designs (e.g. message-passing to an external matcher) cannot offer.

**FBA (Frequent Batch Auction)** (privacy hard fork design): Shielded orders would accumulate threshold-encrypted during a block and be matched in one batch at a uniform clearing price at the tick, removing the speed race that makes front-running profitable. The live order book matches by price-time priority.

**Threshold-encrypted mempool** (privacy hard fork design): Shielded order payloads would be encrypted to a threshold committee of validators (via DKG) so that no minority can peek at order flow before the tick.

**Sealed-bid liquidation** (privacy hard fork design): Liquidations would run as auctions among bonded liquidators with encrypted bids, a ZK proof showing a position is underwater without revealing it. On today's testnet liquidations are open keeper calls to `liquidate(address)` from block 1,605,600.

## Proofs

**SP1**: The RISC-V zkVM that re-executes each block's state transition and produces a proof of it. Public outputs bind the previous and new state roots, so proofs chain.

**Groth16 wrapper**: SP1 proofs are designed to be wrapped into Groth16 (small and cheap to verify in the EVM) so an Ethereum contract (MersennetBridge) can verify Mersennet state; the Ethereum verifier is not yet deployed.

**State root continuity**: Each block proof's public inputs include the previous roots; the bridge rejects any proof that doesn't extend the chain it has already accepted.

**Domain separator**: A label like `MersennetChain-Poseidon-v0` mixed into every hash/derivation so values from one context can never be replayed in another.

## Consensus & economics

**Leader-gated BFT proof-of-stake**: Mersennet's live consensus: one deterministic leader per height with timeout failover; every validator re-executes the block and gossips a signed finality vote; final when >2/3 of stake commits (~2 s blocks). Downtime is benched and jailed, never slashed; only equivocation is slashed.

**HotStuff-2**: A two-phase BFT pipeline implemented in the node and benchmarked (~200 ms finality) as the roadmap upgrade path. Not live on the testnet.

**Staking**: Validators bond MRSN directly; anyone else can delegate MRSN to a validator through the native staking precompile (`0x…0400`) and earn a share of its block rewards, minus commission. Undelegating starts an unbonding period. The validator set is open: any node can register with 1,000 MRSN self-stake and joins the active set (top 12 by self + delegated stake) at the next hourly epoch. See [Staking](/validators/staking/) and [Become a Validator](/validators/become-a-validator/).

**Halving schedule**: Block rewards start at 2⁶¹ − 1 wei (≈2.3 MRSN) and halve every 33,550,336 blocks (the 5th perfect number); total emission converges to ≈154.72M MRSN, well below the 2⁸⁹ − 1 wei (≈618.97M MRSN) supply cap. See [Tokenomics](/architecture/tokenomics/).

**Mersenne prime**: A prime of the form 2ᵖ−1. The network's namesake and its chain IDs: testnet `131071` (2¹⁷−1), mainnet `8191` (2¹³−1). The logo's five bars are `11111₂` = 31 = 2⁵−1.
