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
| **Ticks** | BTC and ETH trade on $1 / $10 integer ticks; from block 1,569,600 MRSN, SOL and ARB trade on **$0.01 ticks** (`priceScale` 100 on chain — the terminal shows human prices everywhere). |
| **One-click trading** | An **agent key** kept in your browser, granted on-chain by your wallet (`setAgent` on the precompile, ~7 days, two confirmations to set up: the grant and 3 MRSN of gas). It signs orders, TP/SL and conditional orders without popups; orders, positions and collateral stay on your main wallet; the key can never withdraw. Revoke any time from Settings. Activates at the agent-delegation switch height (see Network Info). |
| **Fees** | The testnet charges **no trading fee**; the planned schedule shown in the terminal starts at 0% maker / 0.035% taker and falls with 30-day volume |
| **Funding** | Every 8 hours (typical rates ±0.01% per interval) |
| **Collateral** | Native MRSN plus registered tokens (e.g. USDC), fully escrowed on-chain by the precompile |
| **Chain** | Mersennet Testnet (Chain ID 131071) |
| **Wallet** | MetaMask or any EVM-compatible wallet — plus a gasless mode |

## How It Works

Mersennet Trade talks to the MersennetOrders precompile, a native order-matching engine embedded at the EVM level. Orders are consensus objects: every order is a transaction that mines in a block, executes deterministically on every validator, and emits on-chain trade events.

```
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
- **Gasless mode** submits orders through the node's relay so testnet users can trade without holding gas — on mainnet, orders will be wallet-signed precompile transactions only

## Markets

Five markets are seeded at genesis, and anyone can list a new market permissionlessly by calling `createMarket` on the precompile (100 MRSN listing fee):

| Market | Max Leverage |
|--------|--------------|
| MRSN | 50× |
| BTC | 100× |
| ETH | 50× |
| SOL | 20× |
| ARB | 20× |

Additional user-created markets appear alongside the genesis five — query `mersennet_orders_getMarkets` for the live set.

## Getting Started

1. Visit [https://trade.mersennet.com](https://trade.mersennet.com)
2. Connect your MetaMask wallet to Mersennet (Chain ID 131071) — the site can add the network for you
3. Get testnet MRSN from the [Faucet](/getting-started/faucet)
4. Deposit collateral (escrowed 1:1 from your native MRSN)
5. Place limit or market orders — long or short, up to the market's max leverage

## Points, staking and validators

The terminal is also where testnet participation is tracked and where the validator set is managed:

- **Points** ([/points](https://trade.mersennet.com/points)): 1 point per $1 traded; **0.1 point per MRSN per day** deposited in the maker vault; **500 points a day** for running a verified node (automatic once your node has an operator address — see [Run a Node](/validators/run-a-node/#get-recognised-verified-node-runner)); **referrals** pay the referrer 10% of each referee's trading points (the referee confirms the link with one signature; nothing is deducted from them); the **weekly sprint** awards the top three traders by volume 3,000 / 2,000 / 1,000 bonus points every Monday 00:00 UTC ([leaderboard](https://trade.mersennet.com/leaderboard)).
- **Maker vault** ([/vault](https://trade.mersennet.com/vault)): pool MRSN behind the market maker that quotes every market. Deposits mint `mvMRSN` shares at the vault's net asset value (free MRSN + collateral on the precompile + unrealized PnL at mid), so maker PnL moves the share price; withdraw any time at NAV from the vault's free reserve (10% of NAV) and, beyond that, from collateral not backing open positions. The bot trades for the vault through **agent delegation** — it can place and cancel orders in the vault's name, never withdraw. Depositors earn **LP points: 0.1 per MRSN per day**. Contract `0x2ccc6FB9a1853Ad4C217047CC74Bd0D032325284` (`contracts/src/orders/MakerVault.sol`); testnet MRSN has no monetary value.
- **Staking** ([/staking](https://trade.mersennet.com/staking)): delegate MRSN to any validator, claim rewards, and — with a verified node — **register as a validator** in one click (1,000 MRSN self-stake; [Become a Validator](/validators/become-a-validator/)).

## Related Resources

- [MersennetOrders Architecture](/architecture/order-book): How the native CLOB precompile works
- [RPC Methods](/developers/rpc/methods): `mersennet_orders_*` API for bots and integrations
- [Deployed Contracts](/resources/contracts): Precompile addresses and ABIs
