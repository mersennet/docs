---
title: "Your First Private Trade"
description: "An end-to-end walkthrough: connect to the Mersennet testnet, shield MRSN into a private note, place a shielded order, watch it settle, and verify the chain with an SP1 state proof."
---

In about fifteen minutes you'll go from an empty wallet to a settled trade that nobody (not the node, not the sequencer, not the order book) could attribute to you, using the real `@mersennet/sdk`.

:::caution[Shielded methods are fork-gated]
Steps 1–2 (connect, faucet) run against the live public testnet today. The shielded mutation methods used in Steps 3–5 (`mersennet_submitShield`, `mersennet_submitShieldedOrder`, …) are gated by the **privacy hard fork** and return error `-32605` on the current public testnet until it activates. To run those steps end-to-end now, use a local dev node started in privacy mode; the code is identical.
:::

## What you'll build

By the end of this tutorial you will have:

- Connected to the Mersennet testnet over JSON-RPC and verified the chain ID.
- Funded a transparent account with testnet MRSN from the faucet.
- **Shielded** MRSN into a private note in the on-chain commitment tree.
- Placed a **shielded order** on the MRSN market, public only as a bucketed tier.
- Reconstructed your private balance client-side from encrypted notes.
- Verified the chain's state transition with an **SP1 proof**, with no trust in the node required.

**Prerequisites:**

- Node.js 20+ (the SDK targets modern `fetch` and `bigint`).
- Testnet MRSN from the [faucet](/getting-started/faucet/).
- The SDK: build from the monorepo (`cd sdk-ts && npm install && npm run build`, then `npm link`). Publication to npm as `@mersennet/sdk` is pending.

:::tip[When a call fails]
Every RPC error code Mersennet returns is catalogued in the [error reference](/developers/rpc/errors/). Keep it open: the codes are specific, and the `data` field usually names the exact problem.
:::

## Step 1: Connect

Point a `MersennetProvider` at the public testnet RPC and confirm you're on the right chain. The testnet chain ID is `0x1ffff`, which is 131071, a Mersenne prime, naturally.

```ts title="connect.ts"
import { MersennetProvider } from '@mersennet/sdk';

const provider = new MersennetProvider('https://rpc.mersennet.com');

const chainId = await provider.getChainId();
if (chainId !== 131071) {
  throw new Error(`Expected chain 131071 (0x1ffff), got ${chainId}`);
}

const block = await provider.getBlockNumber();
console.log(`Connected to Mersennet testnet at block ${block}`);
```

The same check, raw:

```bash title="verify-chain-id.sh"
curl -X POST https://rpc.mersennet.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# → { "jsonrpc": "2.0", "id": 1, "result": "0x1ffff" }
```

If the result isn't `0x1ffff`, stop: you're talking to the wrong network.

## Step 2: Get testnet MRSN

Request funds from the faucet at **https://faucet.mersennet.com**. Paste your address in the web UI, or script it:

```bash title="request-funds.sh"
curl -X POST https://faucet.mersennet.com/faucet \
  -H "Content-Type: application/json" \
  -d '{"address": "0xYourWalletAddress"}'
```

Then confirm the MRSN landed:

```ts title="check-balance.ts"
const balance = await provider.getBalance('0xYourWalletAddress');
console.log(`Transparent balance: ${BigInt(balance)} wei`);
```

The faucet is rate-limited per address and per IP. Details and troubleshooting live on the [faucet page](/getting-started/faucet/).

## Step 3: Shield your MRSN

Right now your balance is transparent: anyone can read it. Privacy starts when you move value into the shielded pool.

Two sentences of theory. A **note** is an encrypted record of value: asset, amount, owner public key, and randomness, and only you (and anyone you explicitly authorize) can read it. A **commitment** is a hiding, binding hash of that note, appended to the on-chain commitment tree, revealing nothing about the contents. The full model, including nullifiers, which retire notes when spent, is in [Shielded accounts](/privacy/shielded-accounts/), and every term is defined in the [glossary](/resources/glossary/).

First, derive your viewing key and the note you're about to mint:

```ts title="shield.ts"
import { randomBytes } from 'node:crypto';
import {
  MersennetProvider,
  ViewingKeyHelpers,
  defaultNoteCommitment,
} from '@mersennet/sdk';
import type { Note } from '@mersennet/sdk';

const provider = new MersennetProvider('https://rpc.mersennet.com');
const vk = ViewingKeyHelpers.fromSeed(process.env.WALLET_SEED!);

// The note you are about to mint: 10 MRSN, owned by your spending key.
const fr = () => '0x' + randomBytes(32).toString('hex');
const note: Note = {
  value: 10_000_000_000_000_000_000n, // 10 MRSN
  assetId: 0,                         // native MRSN
  ownerPk: vk.spendPk,
  rho: fr(),
  psi: fr(),
};
const commitment = defaultNoteCommitment(note);

// The shield envelope is the bincode encoding of (your EOA, the amount,
// the new note commitment), 0x-hex — the standard encoding for every
// opaque payload on the shielded surface. bincode uses fixed-width
// little-endian integers, so the envelope is a plain byte concatenation:
const strip = (hex: string) => hex.replace(/^0x/, '');
const leHex = (value: bigint, byteLen: number) => {
  const out = Buffer.alloc(byteLen);
  for (let i = 0; i < byteLen; i += 1) {
    out[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return out.toString('hex');
};

const eoa = '0xYourWalletAddress'; // the transparent account funded in Step 2
const shieldEnvelopeHex =
  '0x' +
  strip(eoa) +            // your EOA (20 bytes)
  leHex(note.value, 32) + // the amount (u256, little-endian)
  strip(commitment);      // the new note commitment (32 bytes)

const result = await provider.request('mersennet_submitShield', [
  { envelopeBincodeHex: shieldEnvelopeHex },
]);
console.log('Shielded:', result);
```

The chain records only the commitment. Your address appears once (in the shield itself, because value is visibly *entering* the pool) and never again. Everything you do from here is unlinkable to it. See the [Shielded JSON-RPC reference](/developers/privacy/shielded-rpc/) for the exact payload format and its counterpart, `mersennet_submitUnshield`.

:::note[Activation gate]
Shielded mutation methods are gated by the privacy hard fork. On a pre-privacy node they return error `-32605` ("method disabled in current chain mode"). If you hit it, you're either on the wrong endpoint or the fork hasn't activated on that network yet.
:::

## Step 4: Place a private order

This is the moment. One call places a shielded limit order on the on-chain order book:

```ts title="place-order.ts"
import { MersennetProvider, ShieldedClient, ViewingKeyHelpers } from '@mersennet/sdk';

const provider = new MersennetProvider('https://rpc.mersennet.com');
const vk = ViewingKeyHelpers.fromSeed(process.env.WALLET_SEED!);
const client = new ShieldedClient({ provider, viewingKey: vk });

// Market 1 = MRSN. Buy 5 lots at a limit price of 130 ticks.
const { intentId } = await client.placeOrder({
  marketId: 1n,
  side: 'buy',
  price: 130n,
  size: 5n,
});
console.log('Order intent submitted:', intentId);
```

Under the hood, `placeOrder` fetches the current shielded root as the proof anchor, builds the `OrderPlace` circuit inputs, and submits a `mersennet_submitShieldedOrder` intent. What's remarkable is what the chain *doesn't* learn:

| | |
|---|---|
| **Hidden** | Your identity, your exact price, your exact size. They live in the proof witness and the encrypted intent, never on chain in the clear. |
| **Public** | The market ID and **bucketed tiers**: a `priceBand` and `sizeBand` coarse enough to be unlinkable, precise enough for the chain to run margin and risk checks in zero knowledge. |

Your intent travels threshold-encrypted through the mempool, so validators order it without reading it. At the next frequent-batch-auction (FBA) tick the committee decrypts the batch, matches everything at one uniform clearing price, and applies fills to the book:

<svg viewBox="0 0 700 260" role="img" aria-label="Flow of a private order: your wallet sends an encrypted order to the threshold mempool, which feeds the FBA tick into order book 0x0100" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; height: auto;">
  <rect x="1" y="1" width="698" height="258" rx="8" fill="#0a0c0b" stroke="#2a2a31" stroke-width="2"/>
  <g font-family="monospace" font-size="13">
    <!-- Your wallet -->
    <rect x="30" y="90" width="140" height="56" rx="6" fill="none" stroke="#7dff9b" stroke-width="1.5"/>
    <text x="100" y="123" fill="#7dff9b" text-anchor="middle">[Your wallet]</text>
    <!-- encrypted hop -->
    <line x1="170" y1="118" x2="270" y2="118" stroke="#7dff9b" stroke-width="1.5"/>
    <polygon points="270,118 260,113 260,123" fill="#7dff9b"/>
    <text x="220" y="98" fill="#9a9aa6" text-anchor="middle" font-size="11">encrypted order</text>
    <!-- lock glyph -->
    <rect x="212" y="124" width="16" height="12" rx="2" fill="#0a0c0b" stroke="#7dff9b" stroke-width="1.5"/>
    <path d="M 215 124 v -4 a 5 4 0 0 1 10 0 v 4" fill="none" stroke="#7dff9b" stroke-width="1.5"/>
    <!-- Threshold mempool -->
    <rect x="272" y="90" width="170" height="56" rx="6" fill="none" stroke="#7dff9b" stroke-width="1.5"/>
    <text x="357" y="123" fill="#7dff9b" text-anchor="middle">[Threshold mempool]</text>
    <!-- FBA hop -->
    <line x1="442" y1="118" x2="500" y2="118" stroke="#7dff9b" stroke-width="1.5"/>
    <polygon points="500,118 490,113 490,123" fill="#7dff9b"/>
    <text x="471" y="98" fill="#9a9aa6" text-anchor="middle" font-size="11">FBA tick</text>
    <!-- Order book -->
    <rect x="502" y="90" width="168" height="56" rx="6" fill="none" stroke="#7dff9b" stroke-width="1.5"/>
    <text x="586" y="116" fill="#7dff9b" text-anchor="middle">[Order book</text>
    <text x="586" y="134" fill="#7dff9b" text-anchor="middle">0x0100]</text>
    <!-- legend -->
    <text x="100" y="190" fill="#9a9aa6" font-size="11">hidden: identity, size, price</text>
    <text x="100" y="210" fill="#9a9aa6" font-size="11">public: market, bucketed tier</text>
    <line x1="84" y1="186" x2="94" y2="186" stroke="#2a2a31" stroke-width="2"/>
    <line x1="84" y1="206" x2="94" y2="206" stroke="#7dff9b" stroke-width="2"/>
  </g>
</svg>

:::caution[Testnet markets are sparse]
Liquidity on the testnet order book is thin and intermittent. Your order may rest unmatched for several FBA ticks: that's the testnet, not your code. Check public per-market activity with `mersennet_getShieldedMarketAggregates` before assuming something is broken.
:::

## Step 5: Watch it settle

There is no `getMyFills` endpoint, by design. The node never learns which fills are yours, so your wallet reconstructs its own state by scanning encrypted notes and decrypting the ones addressed to your viewing key. Mint a self-grant (`mersennet_viewGrantToken` issued to your own viewing key; see [selective disclosure](/privacy/selective-disclosure/)), then scan:

```ts title="watch-settlement.ts"
// Scan and decrypt your own notes, refreshing the local note cache.
const scan = await client.scanOwnNotes(selfGrantId, { limit: 100 });
console.log(
  `Decrypted ${scan.notes.length} of ${scan.totalEncryptedNoteCount} notes ` +
  `as of block ${scan.blockNumber}`
);

// Sum the cached notes per asset.
const balance = await client.getBalance();
console.log('Notes held:', balance.noteCount);
console.log('Per-asset totals:', balance.perAsset);

// Spendable view: exclude notes whose nullifiers are already on chain.
const portfolio = client.reconstructBalances({ spentNullifiers });
console.log('Spendable:', portfolio.perAsset, 'unspent notes:', portfolio.unspentNoteCount);
```

When your order fills, a new note appears in the scan and your reconstructed balance moves: that's settlement, observed entirely client-side. For the public side of the same event, subscribe to `newClearingPrice` or `BatchAuctionResults` over WebSocket (`wss://rpc.mersennet.com`). The full workflow, including nullifier tracking, is covered in [Note scanning & wallet reconstruction](/privacy/note-scanning/).

## Step 6: Verify the chain

You've trusted the RPC node for six steps. Now stop. Every Mersennet block carries a zero-knowledge proof that the whole state transition (your shield, your order, the auction that matched it) was executed correctly:

```bash title="fetch-state-proof.sh"
curl -X POST https://rpc.mersennet.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"mersennet_getLatestStateProof","params":[],"id":1}'
```

The response carries `prevStateRoot`, `newStateRoot`, the nullifier roots, and `proofBincodeHex` with `"proofType": "SP1"`. Check it yourself, statelessly, with `mersennet_verifyStateProof`. Note the `proverMode` field: the public testnet currently runs the **development prover**, which exercises the full proof pipeline without paying real SP1 proving cost. The production design wraps each SP1 proof into a Groth16 proof for verification by an Ethereum contract (not yet deployed), so that even an Ethereum light client can accept Mersennet state roots without trusting a single Mersennet node. Details in [Verifiable state: SP1 + Groth16](/privacy/state-proofs/).

That's the whole loop: private to everyone, verifiable by anyone.

## Where to go next

- **[Shielded SDK](/developers/privacy/shielded-sdk/)**: production proving with `NoirWasmProver`, full reconstruction APIs, selective disclosure, and migration helpers.
- **[MersennetOrders architecture](/architecture/order-book/)**: how the on-chain CLOB, the FBA engine, and the `0x…0100` precompile fit together.
- **[Run a node](/validators/run-a-node/)**: stop trusting even the proof-serving RPC; run your own.
