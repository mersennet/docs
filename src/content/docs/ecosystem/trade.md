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
| **Order Types** | Limit, Market, Stop, Trailing, TWAP, Scale, Chase — with GTC/IOC/FOK time-in-force, post-only, and on-chain good-till-date expiry |
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

- **Points** ([/points](https://trade.mersennet.com/points)): 1 point per $1 traded; **500 points a day** for running a verified node (automatic once your node has an operator address — see [Run a Node](/validators/run-a-node/#get-recognised-verified-node-runner)).
- **Staking** ([/staking](https://trade.mersennet.com/staking)): delegate MRSN to any validator, claim rewards, and — with a verified node — **register as a validator** in one click (1,000 MRSN self-stake; [Become a Validator](/validators/become-a-validator/)).

## Related Resources

- [MersennetOrders Architecture](/architecture/order-book): How the native CLOB precompile works
- [RPC Methods](/developers/rpc/methods): `mersennet_orders_*` API for bots and integrations
- [Deployed Contracts](/resources/contracts): Precompile addresses and ABIs
