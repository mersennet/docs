---
title: "Points — Season 1"
description: "How Mersennet testnet points are earned in Season 1: trading, running a verified node, the Maker Vault, referrals, the weekly sprint and the bug bounty — exact rates, tiers, eligibility and fair-play rules."
---

Points record how you use the testnet. Your balance, tier and rank are on [trade.mersennet.com/points](https://trade.mersennet.com/points), the ranking on the [leaderboard](https://trade.mersennet.com/leaderboard). **Season 1 is running**; its end date will be announced in advance in the [Telegram group](https://t.me/Mersennet) and on this page.

Points have **no monetary value** and promise no token, allocation or airdrop — see [Testnet Policies](/resources/testnet-policies/#points) and the terminal's [Terms of Use](https://trade.mersennet.com/terms) (§8).

## How points are earned

| Source | Rate | Credited |
|---|---|---|
| **Trading** | 1 point per $1 of notional volume, to **both sides** of every fill — maker and taker | within a few minutes of the fill |
| **Node runner** | 500 points a day per operator wallet with a **verified, online** node (one node counts per operator) | daily, while the node stays verified |
| **Maker Vault** | 0.1 point per MRSN per day deposited (1,000 MRSN for a day = 100 points) | continuously, every few minutes |
| **Referrals** | 10% of each referee's trading points, once the referee confirms your link with one signature | with the referee's trading points |
| **Weekly sprint** | the week's top three traders by volume (maker + taker) receive 3,000 / 2,000 / 1,000 bonus points | shortly after Monday 00:00 UTC, for the week that just ended |
| **Bug bounty** | 1,000 to 50,000 points for a valid security report, by severity — see [below](#bug-bounty) | when the fix is confirmed |

Your total is the sum of all sources. Node verification is automatic within about ten minutes of your node running with an operator address — see [Run a Node](/validators/run-a-node/). Referral codes are on the terminal's [Referrals page](https://trade.mersennet.com/referrals).

## Tiers

| Tier | Total points |
|---|---|
| Bronze | 0 |
| Silver | 1,000 |
| Gold | 10,000 |
| Platinum | 100,000 |
| Diamond | 1,000,000 |

## Fair play

- Trading through the API or the SDKs is welcome — what counts is real volume against the order book.
- The network's own bots (market maker, takers, liquidator) are excluded from points, the sprint and every "human" figure on the [stats page](https://trade.mersennet.com/stats).
- Points earned through **wash trading or self-dealing across wallets, faucet or referral farming, exploiting a bug instead of reporting it**, or automation that misrepresents itself as human use are forfeited, and the wallets involved may be excluded ([Terms §8](https://trade.mersennet.com/terms)).
- Rates can change between seasons. A change during the season is announced before it applies, and totals may be recalculated if a bug in the accounting is found.

## Bug bounty

Found a security issue? Report it privately — never in public — to **security@mersennet.com**, or ask an admin in the [Telegram group](https://t.me/Mersennet) for a private channel. Include steps to reproduce, the affected component and, for chain issues, the block height. We acknowledge within 48 hours.

| Severity | Points | Examples |
|---|---|---|
| Critical | 50,000 | an outsider halts consensus or makes honest nodes diverge; creating, stealing or moving funds, collateral or stake you do not own; an agent key that can withdraw; signature forgery; remote code execution on a node |
| High | 20,000 | one request or transaction crashes or wedges a node; unfair gains through margin, PnL or liquidation arithmetic; bypassing the faucet's limits at scale; authentication bypass on the trade API |
| Medium | 5,000 | bypassing a rate limit on the API or RPC; stored or reflected XSS on the terminal or explorer; leaking non-public data from the API |
| Low | 1,000 | limited-impact information disclosure or misconfiguration |

**Scope**: the node and its precompiles (order book, staking), the trade terminal and API, the explorer, the faucet and the SDKs — all source-available on [GitHub](https://github.com/mersennet). **Out of scope**: third-party services (Cloudflare, wallets, Telegram), social engineering, volumetric denial of service, findings in test code, and scanner output without a working proof.

**Rules**: the first report of an issue earns the points; demonstrate, do not exploit (do not drain accounts or attack the public infrastructure); we set the severity and credit the wallet you name, with a mention in the [changelog](/resources/changelog/) if you want one.
