---
title: "Shielded JSON-RPC reference"
description: "Shielded JSON-RPC and WebSocket methods for wallets, SDKs, and indexers on Mersennet."
---

Reference for the shielded JSON-RPC and WebSocket surface used by wallets, SDK authors, and indexers. For the conceptual model see [Privacy on Mersennet](/privacy/overview/); for typed helpers see the [Shielded SDK](/developers/privacy/shielded-sdk/).

:::note[Activation]
Shielded methods are gated by the privacy hard fork. Before activation, **mutation** methods and every **viewing-grant** method (`mersennet_view*`) return `-32605` ("shielded methods are disabled until the privacy hard fork activates"); the chain and tree reads (`mersennet_getShieldedRoot` / `getShieldedBalance` / `getShieldedNotes` / `getShieldedMarketAggregates`) return the empty pool, and the state-proof methods answer normally.
:::

## Encoding convention

All opaque ZK payloads (proofs, encrypted blobs, intent envelopes) are encoded as `bincode` over the typed Rust struct, then `0x`-hex. The SDKs currently decode note envelopes and plaintexts (`parseEncryptedNotePayload`, `parseShieldedNotePlaintext`); envelope encoders ship with the fork. JSON field names use camelCase to match Ethereum conventions.

## Chain & tree (read-only)

These reads are always available; before privacy activation they return zero/empty values.

### `mersennet_getShieldedRoot()`
Returns the current note commitment tree state: `{ shieldedStateRoot, blockNumber, noteCount, nullifierCount }`.

### `mersennet_getShieldedBalance()`
Returns **aggregate** shielded-pool counters: `{ totalNoteCount, totalNullifierCount, transparentEoaCount }`. The node never decrypts balances; per-account balances are reconstructed **client-side** from notes obtained via a viewing grant (see [`mersennet_viewBalances`](#selective-disclosure-viewing-grants) and the [Shielded SDK](/developers/privacy/shielded-sdk/)).

### `mersennet_getShieldedNotes()`
Returns `{ noteCount, currentRoot }`. Per-account note ciphertexts are fetched through grant-gated reads (`mersennet_viewNotes`), not this method: viewing keys are never handled server-side.

### `mersennet_getShieldedMarketAggregates()`
Public per-market stats for the most recent batch-auction tick: `{ markets: [{ marketId, markPrice, longOpenInterest, shortOpenInterest, lastClearingPrice, lastVolume, liquidatableCount }] }`.

## Shielded mutations

| Method | Purpose |
|---|---|
| `mersennet_submitShieldedTransfer({ envelopeBincodeHex })` | Private P2P transfer: input nullifiers, output commitments, Noir proof. |
| `mersennet_submitShield({ envelopeBincodeHex })` | Transparent → shielded. The envelope is the bincode encoding of `ShieldTx { from: Address, amount: U256, outputCommitment: Fr, encryptedOutput: Vec<u8>, proof: CircuitProof }` — the debited EOA (`tx.origin` must equal it), the amount, the new note's commitment, the note ciphertext for the recipient and the output-circuit proof (`commit(note) == outputCommitment`, `note.value == amount`). Anything else is rejected with `-32602 invalid shield envelope`. |
| `mersennet_submitUnshield({ envelopeBincodeHex })` | Shielded → transparent: spent nullifier, recipient EOA, amount. |
| `mersennet_submitShieldedOrder({ anchorRootHex, nullifierHex, newCommitmentHex, marketId, side, price, size, ownerPkHex, saltHex, tif?, gasLimit?, maxFeePerGas?, proofBytesHex? })` | Submit a threshold-encrypted shielded order intent; returns an `intentId`. |
| `mersennet_submitLiquidationClaim({ claimBincodeHex })` | Bonded-liquidator-only encrypted liquidation claim. |
| `mersennet_submitLiquidationExecute({ executeBincodeHex })` | Auction winner settles the victim's nullifier; mints bounty + insurance. |
| `mersennet_registerLiquidator({ bondCommitmentHex, bondAmount })` | One-time registration with a Pedersen bond (`bondAmount >= 10,000 MRSN`). |

See [Risk checks in zero knowledge](/privacy/zk-risk-checks/) for the liquidation model.

## State proofs

| Method | Purpose |
|---|---|
| `mersennet_getStateProof(blockNumberOrTag?)` | SP1 state-transition proof for a block (or `"latest"`). Accepts `[]`, `["latest"]`, `["0x1f4"]`, or `[500]`. |
| `mersennet_getLatestStateProof()` | Alias for `mersennet_getStateProof(["latest"])`. |
| `mersennet_verifyStateProof({ proofBincodeHex })` | Stateless verifier; returns `{ "valid": true|false }`. |

Response shape (when a proof exists):

```json
{
  "blockHeight": 500,
  "prevStateRoot": "0x…",
  "newStateRoot":  "0x…",
  "prevNullifierRoot": "0x…",
  "newNullifierRoot":  "0x…",
  "blockHash":     "0x…",
  "newMarketStateHash": "0x…",
  "txCount": 12,
  "proofBincodeHex": "0x…",
  "proofType": "SP1",
  "proverMode": "development"
}
```

If the block carries no proof, the response is `{ "blockHeight": …, "proof": null, "reason": … }`. See [Verifiable state](/privacy/state-proofs/).

## Selective-disclosure (viewing grants)

These methods implement the [selective-disclosure grant lifecycle](/privacy/selective-disclosure/). Reads are **authorization gates, not decryption oracles**: they return encrypted notes or public clearing context for the SDK to reconstruct client-side.

| Method | Scope | Purpose |
|---|---|---|
| `mersennet_viewGrantToken` | `[{ grantorCommitmentHex, grantorSigPubkeyHex, granteePubkeyHex, scopes[], startBlock?, endBlock, signatureHex, capabilitiesHashHex?, grantIdHex? }]` | Mint a scoped, expiring viewing grant → `{ grantToken, stored, signatureVerified }`. |
| `mersennet_viewRevokeToken` | `[{ grantIdHex }]` | Revoke a grant immediately → `{ grantId, revoked, alreadyRevoked, revokedAtBlock }`. |
| `mersennet_viewGrantStatus` | `[{ grantIdHex }]` | → `{ exists, status, activeNow, signatureVerified, revoked, revokedAtBlock, grantToken }`. |
| `mersennet_viewPortfolioDigest` | `exports:portfolio_digest` | Authorized digest of the granted portfolio. |
| `mersennet_viewNotes` | `notes:read` | Paginated encrypted notes a grant authorizes (for client decryption). |
| `mersennet_viewBalances` | `balances:read` | Encrypted notes for `reconstructPortfolio`; node never decrypts. |
| `mersennet_viewPositions` | `positions:read` | Public clearing context for `reconstructPositions`. |
| `mersennet_viewOrders` | `orders:read` | Public clearing context for `reconstructOpenOrders`. |

Pagination: balance-style reads take a single object, `[{ grantIdHex, limit?, cursorHex? }]`.

## WebSocket subscriptions

Subscribe via `eth_subscribe` (Ethereum-style) or `mersennet_subscribe` (Mersennet-specific). Both return a hex subscription ID; events arrive as JSON-RPC notifications.

**Ethereum-style:** `newHeads`, `newPendingTransactions`, `logs { address?, topics? }`.

**Mersennet-specific:**

| Subscription | Params | Payload |
|---|---|---|
| `MersennetOrdersTrades` | `(marketId?)` | `{ taker, maker, market_id, side, price, size }` — price and size are decimal strings in chain units (divide the price by the market's `priceScale`) |
| `MersennetOrdersBook` | `(marketId)` | reserved — accepted, not emitted by node 0.7.0 (poll `mersennet_orders_getOrderBook`) |
| `BatchAuctionResults` | `(marketId?)` | reserved — batch auctions run in the privacy hard fork mode |
| `newShieldedRoot` | `()` | `{ blockNumber, newRoot, notesAdded, nullifiersAdded }` |
| `newClearingPrice` | `(marketId?)` | `{ marketId, clearingPrice, matchedSize, intentCount }` |
| `newAuctionSettled` | `(marketId?)` | `{ marketId, winnerBondCommitment, winningBid }` |
| `newStateProof` | `()` | `{ blockNumber, prevStateRoot, newStateRoot, blockHash, txCount, proofType }` |

Privacy-mode payloads are **address-free by construction**: CI enforces that no address fields leak into shielded events.

```bash
wscat -c wss://rpc.mersennet.com
> {"jsonrpc":"2.0","id":1,"method":"mersennet_subscribe","params":["newShieldedRoot"]}
< {"jsonrpc":"2.0","id":1,"result":"0x1"}
```

## Error codes

| Code | Meaning |
|---|---|
| `-32600` | Invalid request |
| `-32601` | Method not found |
| `-32602` | Invalid params |
| `-32603` | Internal error |
| `-32604` | Forbidden: grant missing, expired, revoked, or out of scope — also returned for an unsigned `mersennet_orders_*` mutation on a node with `allow_unsigned_orders_rpc = false` |
| `-32605` | **Shielded methods are disabled until the privacy hard fork activates** |
| `-32000` | Execution error: carries a descriptive message (e.g. proof rejected, stale anchor root, double-spent nullifier, liquidator not registered / bond below minimum) |

## See also

- [Shielded SDK](/developers/privacy/shielded-sdk/): typed client for these methods.
- [JSON-RPC overview](/developers/rpc/overview/) and [methods](/developers/rpc/methods/): the transparent surface.
