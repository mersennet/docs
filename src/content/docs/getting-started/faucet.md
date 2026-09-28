---
title: "Get Testnet MRSN"
---

The Mersennet faucet sends free testnet MRSN — the native token you'll use for gas, trading collateral, and experimenting. It also mints the mock stablecoins (USDC, USDT, DAI) used across the testnet.

## Web Interface

1. Open the faucet: **[https://faucet.mersennet.com](https://faucet.mersennet.com)**
2. Paste your wallet address — or click **Connect** to fill it from MetaMask.
3. Click **Claim 1,000 MRSN** (the faucet adds 1 MRSN for gas, so a single claim covers the validator bond). The drip usually lands within a few seconds; the faucet links you straight to the transaction in the explorer.

Below the main claim you can also grab **10,000 each of MockUSDC, MockUSDT, and MockDAI** with one click per token.

:::tip
One click on **＋ Add Mersennet to wallet** configures MetaMask with the right chain ID (131071), RPC, and explorer — no manual setup needed.
:::

## What You Get

| Claim | Amount | Cooldown |
|-------|--------|----------|
| MRSN (native) | 1,000 MRSN + 1 MRSN for gas | 1 claim per address per hour, at most 3 claims per connection (IP) per day |
| MockUSDC / MockUSDT / MockDAI | 10,000 per token | 1 claim per token per address per hour |

The mock tokens also have a public `faucet()` function on-chain, so contracts and scripts can mint them directly — see [Deployed Contracts](/resources/contracts) for addresses.

## Scripts and CI

Since 28 September 2026 every drip needs a browser challenge (Cloudflare Turnstile), so a bare `curl` to `/faucet` is answered with `403 challenge failed`. The HTTP API is unchanged otherwise — `POST /faucet` with `{"address": "0x…", "turnstileToken": "…"}` — but a token can only be produced by the widget on the faucet page, which is the point.

For scripts, CI pipelines and test suites, fund once and transfer:

1. Claim from the page into a wallet you control (three drips a day per connection — 3,003 MRSN).
2. Transfer from that wallet in your scripts with any EVM tooling, for example with Foundry:

```bash
cast send 0xRecipient --value 100ether \
  --rpc-url https://rpc.mersennet.com --private-key $FUNDING_KEY
```

Running a hackathon, a course, or a large integration test that needs more? Ask in the [Telegram group](https://t.me/Mersennet) — a one-off grant to a funding wallet is a two-minute job on our side.

Mock tokens (`usdc`, `usdt`, `dai`) follow the same rule: claim them on the page, transfer with `cast send <token> "transfer(address,uint256)" …`.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `rate limited` error | Each address — and each IP — can claim MRSN once per hour, and one connection can take at most three drips a day (3,003 MRSN — plenty for testing; validators bond 1,000). Wait for the cooldown shown on the page. |
| `challenge failed` | The page's verification widget did not complete or its token expired — wait for the green tick and try again, or reload. A request from a script without a token always gets this answer (see above). |
| Request fails | Check that your address is a valid 0x-prefixed Ethereum address (40 hex characters). |
| No MRSN received | Look up the returned `tx_hash` on the [explorer](https://explorer.mersennet.com). Confirm your wallet is on Chain ID 131071. |
| Tokens not visible in MetaMask | Import the token contract address manually, or claim through the faucet UI, which offers to add the token for you. |
