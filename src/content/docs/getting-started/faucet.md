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

The HTTP API keeps working without a browser — at a script-sized allowance. Since 28 September 2026 the page runs a Cloudflare Turnstile check; a request **without** the widget's token is served **once per address and once per IP every 24 hours** (1,001 MRSN — enough to fund a pipeline wallet daily), while the page allows one claim an hour and three a day:

```bash
curl -X POST https://faucet.mersennet.com/faucet \
  -H "Content-Type: application/json" \
  -d '{"address": "0xYourWalletAddress"}'
```

```json
{ "success": true, "tx_hash": "0x..." }
```

A second call the same day answers `429` with the reason. Mock tokens work the same way (`token`: `usdc`, `usdt` or `dai`; once per token per day without the widget):

```bash
curl -X POST https://faucet.mersennet.com/claim-token \
  -H "Content-Type: application/json" \
  -d '{"address": "0xYourWalletAddress", "token": "usdc"}'
```

Need more for a hackathon, a course or a large integration test? Fund one wallet and transfer from it (`cast send 0xRecipient --value 100ether --rpc-url https://rpc.mersennet.com --private-key $KEY`), or ask in the [Telegram group](https://t.me/Mersennet) for a one-off grant.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `rate limited` error | Each address — and each IP — can claim MRSN once per hour, and one connection can take at most three drips a day (3,003 MRSN — plenty for testing; validators bond 1,000). Wait for the cooldown shown on the page. |
| `challenge failed` | The page's verification widget did not complete or its token expired — wait for the green tick and try again, or reload. |
| `429` from a script | Scripts without the widget get one drip per address and per IP per day; the page gets more (see above). |
| Request fails | Check that your address is a valid 0x-prefixed Ethereum address (40 hex characters). |
| No MRSN received | Look up the returned `tx_hash` on the [explorer](https://explorer.mersennet.com). Confirm your wallet is on Chain ID 131071. |
| Tokens not visible in MetaMask | Import the token contract address manually, or claim through the faucet UI, which offers to add the token for you. |
