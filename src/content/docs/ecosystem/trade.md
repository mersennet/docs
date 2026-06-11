---
title: "Mersennet Trade"
---

**Mersennet Trade** is the order book trading terminal for Mersennet, providing a professional-grade interface for trading against the native on-chain Central Limit Order Book (CLOB) powered by [MersennetOrders](/architecture/order-book).

:::tip[Live on Testnet]
Mersennet Trade is live at **[https://trade.mersennet.com](https://trade.mersennet.com)**
:::

## Overview

| Feature | Details |
|---------|---------|
| **Type** | Order book trading terminal |
| **Order Engine** | MersennetOrders native precompile (`0x0100`) |
| **Order Types** | Limit, Market |
| **Chain** | Mersennet Testnet (Chain ID 131071) |
| **Wallet** | MetaMask or any EVM-compatible wallet |

## How It Works

Mersennet Trade connects directly to the MersennetOrders precompile—a native on-chain order matching engine embedded at the EVM level. Unlike AMM-based DEXes, Mersennet Trade uses a Central Limit Order Book (CLOB) model where:

- **Limit orders** rest on the book at a specified price until filled or cancelled
- **Market orders** execute immediately against the best available resting orders
- **Matching** is atomic and happens within a single transaction via the precompile

```
User Wallet ──► Mersennet Trade UI ──► Smart Contract ──► MersennetOrders Precompile (0x0100)
                                                          │
                                                  ┌───────┴───────┐
                                                  │  Order Book   │
                                                  │  (on-chain)   │
                                                  └───────────────┘
```

## Trading Pairs

Mersennet Trade supports any pair listed on the MersennetOrders book. Current testnet pairs include:

| Pair | Base Token | Quote Token |
|------|-----------|-------------|
| WMRSN/USDC | WMRSN | MockUSDC |
| WMRSN/USDT | WMRSN | MockUSDT |

## Getting Started

1. Visit [https://trade.mersennet.com](https://trade.mersennet.com)
2. Connect your MetaMask wallet to Mersennet (Chain ID 131071)
3. Get testnet MRSN from the [Faucet](/getting-started/faucet)
4. Get test stablecoins by calling `faucet()` on the [mock token contracts](/resources/contracts)
5. Approve the token you want to trade
6. Place limit or market orders

## Comparison: Mersennet Trade vs Mersennet Swap

| | Mersennet Trade (CLOB) | Mersennet Swap (AMM) |
|-|-------------------|-----------------|
| **Model** | Order book | Constant product / Concentrated liquidity |
| **Price discovery** | Explicit bid/ask | Algorithmic (x*y=k) |
| **Order types** | Limit + Market | Swap only |
| **Slippage** | None on limit orders | Variable |
| **Best for** | Precise entries, professional trading | Quick swaps, LP yield |

## Related Resources

- [MersennetOrders Architecture](/architecture/order-book) — How the native CLOB precompile works
- [Mersennet Swap V2](/ecosystem/swap) — AMM DEX for simple swaps
- [Mersennet Swap V3](/ecosystem/swap-v3) — Concentrated liquidity AMM
- [Deployed Contracts](/resources/contracts) — Token addresses and ABIs
