---
title: "Mersennet Trade"
---

**Mersennet Trade** is the perpetuals trading terminal for Mersennet — a professional-grade interface over the native on-chain Central Limit Order Book (CLOB) powered by [MersennetOrders](/architecture/order-book).

:::tip[Live on Testnet]
Mersennet Trade is live at **[https://trade.mersennet.com](https://trade.mersennet.com)**
:::

## Overview

| Feature | Details |
|---------|---------|
| **Type** | Perpetual futures on a native on-chain order book |
| **Order Engine** | MersennetOrders native precompile (`0x…0100`) |
| **Order Types** | Limit and Market (GTC/IOC/FOK, post-only, on-chain good-till-date expiry) placed directly on the precompile. **Stop, Stop-limit, Trailing stop, TWAP** are armed in your browser and executed as wallet-signed orders when they trigger — silently with one-click trading, otherwise with a wallet popup at trigger time; they fire while a Mersennet Trade tab is open. **Scale** places a ladder of limit orders at once; **Chase** re-pegs a post-only order to the top of the book (needs one-click). |
| **Ticks** | BTC trades on $10 and ETH on $1 integer ticks; since block 1,569,600 MRSN, SOL and ARB trade on **$0.01 ticks** (`priceScale` 100 on chain — the terminal shows human prices everywhere). |
| **One-click trading** | An **agent key** kept in your browser, granted on-chain by your wallet (`setAgent` on the precompile, ~7 days, two confirmations to set up: the grant and 3 MRSN of gas). It signs orders, TP/SL and conditional orders without popups; orders, positions and collateral stay on your main wallet; the key can never withdraw. Revoke any time from Settings. Live since block 1,569,600 (Sat 19 Sep 2026, 19:23 UTC). |
| **Fees** | The testnet charges **no trading fee**; the planned schedule shown in the terminal starts at 0% maker / 0.035% taker and falls with 30-day volume |
| **Funding** | Every 8 hours (typical rates ±0.01% per interval) |
| **Collateral** | Native MRSN plus registered tokens (MockUSDC, the test USDC, at 90% weight), fully escrowed on-chain by the precompile. From block 1,605,600 one collateral unit is **one MRSN**, realized PnL is **settled into collateral at every fill** (a closed trade's profit is withdrawable; a loss beyond your collateral is booked as protocol bad debt), initial margin is **10%** (10× max leverage), **maintenance margin 5%** with **keeper liquidations** (anyone may call `liquidate(address)` on the precompile; an account below maintenance is closed on the book, a 1% fee on the closed notional is split between the keeper and the insurance fund, and the fund covers losses the collateral could not — the network runs a default keeper), and **self-trade prevention** cancels your own resting order instead of filling it. A position can always be *reduced*, however deep under water. Before that height collateral units were wei and PnL was tracked but not settled; balances are divided by 10¹⁸ once at the switch, so a deposit of 100 MRSN made before it is still 100 MRSN after (the terminal, API and SDKs convert for the current era), and a position whose equity is below 5% of its notional in the switch block is closed by the keeper. **Testnet unit convention:** margin and PnL are computed in the markets' quote units, and one MRSN of collateral counts as one quote unit (MockUSDC counts 1:1 at 90% weight) — there is no MRSN/USD conversion in the margin engine yet, so leverage and PnL read as if MRSN were the quote currency. |
| **Chain** | Mersennet Testnet (Chain ID 131071) |
| **Wallet** | MetaMask, Rabby or any EVM-compatible wallet, or WalletConnect. Every order is a wallet-signed transaction; one-click trading replaces the popups with an agent key (above) |

## How It Works

Mersennet Trade talks to the MersennetOrders precompile, a native order-matching engine embedded at the EVM level. Orders are consensus objects: every order is a transaction that mines in a block, executes deterministically on every validator, and emits on-chain trade events.

```text
User Wallet ──► Trade UI ──► JSON-RPC ──► mempool ──► block ──► MersennetOrders (0x…0100)
                                                                │
                                                        ┌───────┴───────┐
                                                        │  Order Book   │
                                                        │  (consensus)  │
                                                        └───────────────┘
```

- **Limit orders** rest on the book at a specified price until filled or cancelled
- **Market orders** cross the spread against the best resting orders
- **Matching** happens inside block execution — fills are on-chain `trade` events, visible in the [explorer](https://explorer.mersennet.com) and streamed over WebSocket
- **Orders are wallet-signed transactions** to the precompile; there is no relay and no gasless path, so every order, cancel and deposit costs gas from your MRSN balance. With **one-click trading** the terminal signs them with a browser agent key you grant on-chain (`setAgent`); that key can place and cancel orders for your account but can never deposit or withdraw

## Markets

Five markets are seeded at genesis, and anyone can list a new market permissionlessly by calling `createMarket` on the precompile (100 MRSN listing fee):

| Market | Max Leverage |
|--------|--------------|
| MRSN | 10× |
| BTC | 10× |
| ETH | 10× |
| SOL | 10× |
| ARB | 10× |

Max leverage is 10× for every market, from the 10% initial margin enforced from block 1,605,600; before that height the chain enforces no margin. Maintenance margin is 5% from the same height.

Additional user-created markets appear alongside the genesis five — query `mersennet_orders_getMarkets` for the live set.

## Getting Started

1. Visit [https://trade.mersennet.com](https://trade.mersennet.com)
2. Connect your MetaMask wallet to Mersennet (Chain ID 131071) — the site can add the network for you
3. Get testnet MRSN from the [Faucet](/getting-started/faucet)
4. Deposit collateral (escrowed 1:1 from your native MRSN)
5. Place limit or market orders — long or short, up to the market's max leverage

A step-by-step walkthrough is in [Your First Trade](/getting-started/first-trade/).

## Points, staking and validators

The terminal is also where testnet participation is tracked and where the validator set is managed:

- **Points** ([/points](https://trade.mersennet.com/points)): 1 point per $1 traded (both the taker and the maker of a fill earn its notional); **0.1 point per MRSN per day** deposited in the maker vault; **500 points a day** for running a verified node (automatic once your node has an operator address — see [Run a Node](/validators/run-a-node/#get-recognised-verified-node-runner)); **referrals** pay the referrer 10% of each referee's trading points (the referee confirms the link with one signature; nothing is deducted from them); the **weekly sprint** awards the top three traders by volume (both sides of each fill) 3,000 / 2,000 / 1,000 bonus points every Monday 00:00 UTC ([leaderboard](https://trade.mersennet.com/leaderboard)).
- **Maker vault** ([/vault](https://trade.mersennet.com/vault)): pool MRSN behind the market maker that quotes every market. Deposits mint `mvMRSN` shares at the vault's net asset value (free MRSN + collateral on the precompile + unrealized PnL at mid), so maker PnL moves the share price; withdraw any time at NAV from the vault's free reserve (10% of NAV) and, beyond that, from collateral not backing open positions. The bot trades for the vault through **agent delegation** — it can place and cancel orders in the vault's name, never withdraw. Depositors earn **LP points: 0.1 per MRSN per day**. Deposits open at block 1,605,600 (Sun 20 Sep 2026). Full description: [Maker Vault](/ecosystem/maker-vault/). Testnet MRSN has no monetary value.
- **Staking** ([/staking](https://trade.mersennet.com/staking)): delegate MRSN to any validator, claim rewards, and — with a verified node — **register as a validator** in one click (1,000 MRSN self-stake; [Become a Validator](/validators/become-a-validator/)).

## Telegram alerts for traders

From the account panel on the trade page you can link a Telegram account (one signed message, no transaction). Once the settlement upgrade is live the bot warns you when a position's equity gets within 1.6× of its maintenance margin and again when the account becomes liquidatable; `/status` answers with your collateral and open positions at any time. Validator operators link the same bot from the [staking page](https://trade.mersennet.com/staking) — see [Monitoring & Alerts](/validators/monitoring/#telegram-alerts-built-in).

## REST and WebSocket API

The terminal's own data layer is public at `https://trade.mersennet.com/api/v1` (REST) and `wss://trade.mersennet.com/ws` (WebSocket); the route list lives at [trade.mersennet.com/api](https://trade.mersennet.com/api).

- **Limits**: 600 requests per minute per IP for reads, 60 per minute for writes. Every response carries `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset`; a `429` body is `{ "error": "Too many requests…" }` for reads and `{ "error": "Rate limit exceeded for write operations." }` for writes.
- **Errors**: `400 { "error": "Invalid parameter", "detail"?: string }` for a non-numeric id, malformed timestamp or out-of-range number; `404 { "error": "Not found" }` for an unknown route or market; `500 { "error": "Internal error" }` for a server fault (logged on our side).
- **Ids**: markets are addressed by numeric id (from `/markets`); `/candles` also accepts a symbol such as `MRSN-USD`.
- **WebSocket**: subscribe with `{ "action": "subscribe", "channel": "ticker:1" }`; frames are capped at 16 KiB and a connection may hold 64 channels. Close code `1009` means a frame was too large, `1013` that the server is busy — reconnect with backoff.

## Related Resources

- [MersennetOrders Architecture](/architecture/order-book): How the native CLOB precompile works
- [RPC Methods](/developers/rpc/methods): `mersennet_orders_*` API for bots and integrations
- [Deployed Contracts](/resources/contracts): Precompile addresses and ABIs
