---
title: "Glossary"
description: "Every Mersennet-specific term — notes, nullifiers, viewing keys, FBA, and the rest — defined in one page."
---

Privacy systems come with vocabulary. Every Mersennet-specific term, defined
once, linked everywhere.

## Shielded accounts

**Note** — The unit of shielded value: a private record `(owner, asset, amount, randomness)`. Your shielded balance is the sum of your unspent notes. Notes never appear on-chain in the clear — only their commitments do.

**Commitment** — A Poseidon hash of a note, inserted into the global commitment tree. It proves the note exists without revealing anything about it.

**Commitment tree** — A Merkle tree (Poseidon-2 over BN254) containing every note commitment ever created. Spend proofs reference a recent tree root, so the chain keeps a 64-block ring of recent roots to give clients a proving window.

**Nullifier** — A unique tag derived from a note and its owner's key, published when the note is spent. The chain rejects duplicate nullifiers — that's double-spend prevention — but a nullifier cannot be linked back to its note.

**Shield / Unshield** — Moving value between transparent EVM balances and shielded notes, via the precompile at `0x0201`. Shielding debits your public balance and mints a commitment; unshielding consumes a note (publishing its nullifier) and credits a public address. These are the only moments value visibly crosses the boundary.

**Viewing key** — The key pair that can *see* your notes without being able to *spend* them. Spending requires the separate spend key. Viewing keys make [selective disclosure](/privacy/selective-disclosure/) possible.

**Grant** — A scoped, expiring delegation of read access derived from your viewing key — e.g. "balances and positions, until 2026-12-31" for an auditor. Enforced by `-32604` on out-of-scope reads.

**Note scanning** — How a wallet finds its money: trial-decrypting encrypted note payloads in each block with the viewing key, locally. The chain never learns which notes are yours. See [Note Scanning](/privacy/note-scanning/).

**Migration note** — At the privacy hard fork, every transparent balance is deterministically converted into one shielded note per account. The derivation labels (`MersennetChain-MigrationRho/Psi`) let wallets recognize their migrated funds.

## Order book

**MersennetOrders** — The chain-native central limit order book (CLOB), exposed to Solidity at precompile `0x0100`. Matching is price-time priority and happens in consensus — no off-chain sequencer.

**Atomic composability** — A contract can place an order and read its fill in the *same transaction*, because the order book is a precompile sharing state with the EVM. This is the property asynchronous designs (e.g. message-passing to an external matcher) cannot offer.

**FBA — Frequent Batch Auction** — Orders accumulate threshold-encrypted during a block and are matched in one batch at a uniform clearing price at the tick. Removes the speed race that makes front-running profitable.

**Threshold-encrypted mempool** — Shielded order payloads are encrypted to a 5-of-7 committee of validators (via DKG); no minority can peek at order flow before the tick.

**Sealed-bid liquidation** — Liquidations run as auctions among bonded liquidators with encrypted bids; a ZK proof shows a position is underwater without revealing it. The liquidated account's identity never appears on-chain.

## Proofs

**SP1** — The RISC-V zkVM that re-executes each block's state transition and produces a proof of it. Public outputs bind the previous and new state roots, so proofs chain.

**Groth16 wrapper** — SP1 proofs are wrapped into Groth16 — small and cheap to verify in the EVM — so an Ethereum contract ([MersennetBridge](https://github.com/mersennet/contracts)) can verify Mersennet state.

**State root continuity** — Each block proof's public inputs include the previous roots; the bridge rejects any proof that doesn't extend the chain it has already accepted.

**Domain separator** — A label like `MersennetChain-Poseidon-v0` mixed into every hash/derivation so values from one context can never be replayed in another.

## Consensus & economics

**HotStuff-2** — Mersennet's BFT consensus: two-phase, stake-weighted voting with rotating proposers; finality when >2/3 of stake commits (~1s blocks).

**Direct staking** — Validators bond MRSN directly; delegation is not yet implemented. See [Staking](/validators/staking/).

**Halving schedule** — Block rewards start at 2⁶¹ − 1 wei (≈2.3 MRSN) and halve every 33,550,336 blocks (the 5th perfect number); total emission converges to ≈154.72M MRSN, well below the 2⁸⁹ − 1 wei (≈618.97M MRSN) supply cap. See [Tokenomics](/architecture/tokenomics/).

**Mersenne prime** — A prime of the form 2ᵖ−1. The network's namesake and its chain IDs: testnet `131071` (2¹⁷−1), mainnet `8191` (2¹³−1) — and the logo's five bars are `11111₂` = 31 = 2⁵−1.
