---
title: "Shielded SDK"
description: "Client-side privacy primitives in the Mersennet JavaScript SDK: proving, note scanning, reconstruction, selective disclosure, and migration."
---

The Mersennet JavaScript SDK (`@mersennet/sdk`) ships a **shielded surface** for wallets and apps that connect to a chain with the ZK privacy hard fork activated.

:::note[Activation]
The public testnet has not activated the privacy hard fork: every `mersennet_view*` call and every shielded mutation returns `-32605` today. The helpers below run entirely client-side, so they can be exercised against mock or locally generated data (and a local privacy-enabled node); nothing here moves value on the public testnet yet.
::: It covers client-side proving, note scanning, balance/position/order reconstruction, selective-disclosure reads, and migration.

All shielded crypto runs **client-side**. The node is never asked to decrypt your data; it only verifies proofs and gates authorized reads. See [Privacy on Mersennet](/privacy/overview/) for the conceptual model.

## Install

```bash
npm install github:mersennet/sdk-ts#semver:^0.1   # npm publication as @mersennet/sdk is pending
# or, from a checkout:
npm install /path/to/sdk-ts
```

## Modules at a glance

| Area | Exports |
|---|---|
| Shielded client | `ShieldedClient` (`getBalance`, `reconstructBalances`, `scanOwnNotes`, `scanRecentBlocks`, `placeOrder`, `setProver`, `setGrantedViewingMaterial`, `publicKeys`), `ViewingKeyHelpers`, `createOwnerViewingMaterial`, `createMockNoteDecryptor` — `ViewingKeyHelpers.fromSeed` / `delegateViewToken` are deterministic test helpers today; production key derivation and grant tokens are not implemented yet |
| Attestations | `buildPortfolioAttestation`, `verifyAttestation`, `computePortfolioDigest`, `ATTESTATION_VERSION`, `ComplianceAttestation` |
| Note scanning | `scanGrantedNotes`, `parseEncryptedNotePayload`, `parseShieldedNotePlaintext` |
| Reconstruction | `reconstructPortfolio`, `scanAndReconstructBalances`, `defaultNullifierDeriver` |
| Positions & orders | `reconstructPositions`, `reconstructOpenOrders` |
| Client-side proving | `NoirWasmProver` |
| Migration | `planMigration`, `confirmMigration`, `deriveMigrationNote`, `matchesMigrationNote`, `defaultNoteCommitment` |

## Client-side proving (`NoirWasmProver`)

Shielded transactions require a Noir proof generated in the wallet, so keys never leave the device. `NoirWasmProver` wraps a proving backend that the wallet injects (built on `@noir-lang/noir_js` + `@aztec/bb.js`). Until the order circuits ship, `ShieldedClient.placeOrder` feeds mock public inputs to the prover — the flow is end-to-end testable, the proof is not yet meaningful.

```ts
import { NoirWasmProver } from '@mersennet/sdk';

const prover = new NoirWasmProver({ backend });   // backend: NoirProvingBackend
// Typed circuit helpers map to named Noir circuit inputs:
const proof = await prover.proveOrderPlace(orderInputs);
// also available: prover.proveSpend(...), prover.proveOutput(...)
```

Relevant types: `NoirCircuitName`, `NoirInputValue`, `NoirProvingBackend`, `NoirWasmProverOptions`.

## Note scanning & balance reconstruction

Rebuild private balances locally from encrypted notes (see [Note scanning](/privacy/note-scanning/)):

```ts
import { scanAndReconstructBalances } from '@mersennet/sdk';

const result = await scanAndReconstructBalances(
  provider,          // MersennetProvider
  viewingMaterial,   // GrantedViewingMaterial (carries the grant id)
  { limit: 100 },    // options: drives a paged mersennet_viewBalances scan
);
// result.perAsset → per-asset totals, spent notes excluded via nullifiers
```

Lower-level building blocks are also exported: `scanGrantedNotes` (decrypt authorized notes), `defaultNullifierDeriver` (derive nullifiers), and `reconstructPortfolio` (sum unspent notes).

Types: `Note`, `EncryptedNote`, `GrantedDecryptedNote`, `GrantedNoteScanOptions`, `GrantedNoteScanResult`, `GrantedViewingMaterial`, `ShieldedBalance`, `ViewingKey`, `PortfolioNote`, `ReconstructedPortfolio`, `NullifierDeriver`, `BalanceReconstructionResult`.

## Positions & open orders

```ts
import { reconstructPositions, reconstructOpenOrders } from '@mersennet/sdk';

const positions = reconstructPositions({ orders, fills /* local records */ });
const openOrders = reconstructOpenOrders({ orders });
```

Types: `OrderSide`, `OrderRecord`, `FillRecord`, `OpenOrder`, `ReconstructedPosition`, `ReconstructTradingOptions`.

## Selective disclosure

A grantee uses the same reconstruction primitives, but over the data a [viewing grant](/privacy/selective-disclosure/) authorizes. Fetch authorized notes/records via the grant-gated RPC methods (`mersennet_viewNotes`, `mersennet_viewBalances`, `mersennet_viewPositions`, `mersennet_viewOrders`) and run `reconstructPortfolio` / `reconstructPositions` / `reconstructOpenOrders` client-side.

## Migration

Drive transparent → shielded migration with a plan-then-confirm flow (see [Migration](/privacy/migration/)):

```ts
import { planMigration, confirmMigration } from '@mersennet/sdk';

const plan = planMigration(accounts);            // accounts: MigrationNoteParams[]
// plan → per-asset totals to preview; the fork mints these notes automatically (no transaction to submit)
const result = confirmMigration(accounts, scannedNotes); // post-fork landed-note confirmation
```

Types: `MigrationNote`, `MigrationNoteParams`, `MigrationPlan`, `MigrationConfirmation`, `NoteCommitmentHasher`.

## See also

- [Shielded JSON-RPC reference](/developers/privacy/shielded-rpc/): the methods these helpers call.
- [JavaScript SDK](/developers/sdks/javascript/): the transparent (eth_* / mersennet_* / mersennet_orders_*) surface.
