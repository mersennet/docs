---
title: "Your First Trade"
description: "Connect a wallet to the Mersennet Trade terminal, claim faucet MRSN, deposit collateral, place and close a market order on the on-chain order book, and see what it earns in points."
---

This guide takes you from an empty wallet to a closed position on [Mersennet Trade](https://trade.mersennet.com), the terminal over the native on-chain order book. No code is needed; every step is a wallet click. It takes about ten minutes, and nothing on the testnet has monetary value.

:::note[Every order is a transaction]
Orders, cancels, deposits and withdrawals are wallet-signed transactions to the order-book precompile at `0x…0100`. There is no relay and no gasless path, so each action costs a little gas from your MRSN balance and shows up on the [explorer](https://explorer.mersennet.com) like any other transaction. One-click trading (Settings → One-Click Trading, from block 1,569,600) replaces the wallet popups with a browser agent key you grant on-chain; the key can place and cancel orders for your account but never withdraw.
:::

## Step 1: Connect a wallet

1. Open [https://trade.mersennet.com](https://trade.mersennet.com).
2. Press **Connect** and pick MetaMask, Rabby or WalletConnect.
3. Approve the network prompt: the terminal adds Mersennet Testnet (chain ID `131071`, RPC `https://rpc.mersennet.com`) to your wallet and switches to it. If your wallet does not prompt, add the network by hand with the values in [Wallet Setup](/getting-started/wallet-setup/).

## Step 2: Claim testnet MRSN

1. Open [https://faucet.mersennet.com](https://faucet.mersennet.com) and paste your address, or press **Connect** to fill it in.
2. Press **Claim 1,000 MRSN**. The faucet sends **1,001 MRSN** (1,000 plus 1 for gas), once per address per hour. The same page hands out 10,000 each of MockUSDC, MockUSDT and MockDAI; you do not need them for this guide.
3. Back in the terminal, your wallet balance updates within a few seconds.

Details and the HTTP API: [Get Testnet MRSN](/getting-started/faucet/).

## Step 3: Deposit collateral

Trading uses collateral escrowed by the precompile, not your wallet balance directly.

1. In the **Account** panel choose **Deposit**.
2. Enter an amount, for example **500 MRSN**, and confirm the transaction in your wallet. Keep some MRSN in the wallet for gas.
3. When the transaction mines (one or two blocks, a few seconds) the Account panel shows the collateral and your available margin.

Withdrawing is the same panel in reverse; the chain checks your margin before releasing collateral.

## Step 4: Place a market order

1. Select the **MRSN/USD** market.
2. In the order form choose **Market** and **Buy**, enter a size of **1** MRSN, and press **Buy**. Confirm the transaction in your wallet.
3. The order mines in the next block and fills against the best resting asks. The fill appears in **Positions** (size, entry price, unrealized PnL) and in **Trades**; the transaction is on the explorer under your address (`https://explorer.mersennet.com/address/0x…`).

Two order types cover most trading:

- **Limit**: rests on the book at your price until it fills or you cancel it. Time-in-force options are GTC, IOC, FOK, post-only and good-till-date.
- **Market**: crosses the spread and fills immediately against the best resting orders.

Stop, stop-limit, trailing-stop and TWAP orders are armed in your browser and sent as signed orders when they trigger; they fire while a terminal tab is open.

## Step 5: Close the position

1. In **Positions**, press **Close** on the MRSN position. The terminal prepares a market order in the opposite direction for the full size.
2. Or place a sell order yourself with **Reduce-only** ticked, so the order can only shrink the position and never flip it short.
3. Confirm in your wallet. When it mines, the position disappears and its result is shown in your trade history.

## Step 6: Points

Testnet participation is tracked on the [Points page](https://trade.mersennet.com/points):

- **1 point per $1 traded** (bots are excluded): a 1 MRSN order at a $100 price earns about 100 points.
- The [leaderboard](https://trade.mersennet.com/leaderboard) ranks traders by points and shows the **weekly sprint**: the top 3 traders by volume each week earn 3,000 / 2,000 / 1,000 bonus points.
- Other live programs: 500 points a day for a verified node, 0.1 LP point per MRSN per day in the maker vault, and referrals (10% of a referee's trading points).

:::note[Units on testnet]
Prices are quoted in USD; balances, PnL and equity are shown in MRSN. In the margin engine one MRSN of collateral counts as one dollar of margin — there is no MRSN/USD conversion on the testnet yet — so leverage and PnL read as if MRSN were the quote currency. MockUSDC (the test USDC) is also accepted as collateral at 90% weight.
:::

:::caution[What changes this weekend]
Two protocol switches land at announced block heights (about 2.1 s per block; live ETAs at [trade.mersennet.com/api/v1/protocol/switches](https://trade.mersennet.com/api/v1/protocol/switches) and on the [staking page](https://trade.mersennet.com/staking)):

- **Block 1,569,600 (Sat 19 Sep, about 19:00 UTC)**: agent delegation (one-click trading), $0.01 ticks on MRSN, SOL and ARB, validator benching and escalating jail.
- **Block 1,605,600 (Sun 20 Sep, about 16:00 UTC)**: settlement. One collateral unit becomes one MRSN, realized PnL settles into collateral at every fill, initial margin is 10% (10× maximum leverage) and maintenance margin 5% with keeper liquidations. Before this height the chain enforces no margin. Maker vault deposits open at the same height.

Your collateral and open positions carry over; the terminal converts units for the current era. Full details: [Scheduled protocol switches](/getting-started/network-info/#protocol-upgrades).
:::

## Next steps

- [Mersennet Trade](/ecosystem/trade/): order types, fees, funding, one-click trading, points, the maker vault and staking.
- [Trade via SDK and RPC](/developers/tutorials/trade-via-sdk/): the same flow from TypeScript, Python or Go.
- [Test the Network](/getting-started/test-the-network/): run a node, become a validator, delegate.
