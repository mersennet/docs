---
title: "Token Economics"
---

This document reflects the current tokenomics for Mersennet (MRSN), including the updated supply cap, allocation mix, emission curve, and validator reward mechanics.

## Overview

| Parameter | Value |
|-----------|-------|
| **Token Name** | Mersennet |
| **Ticker** | MRSN |
| **Total Supply** | 618,970,019.642690137449562111 MRSN (2^89 − 1) |
| **Decimals** | 18 |
| **Consensus** | Proof-of-Stake (HotStuff-2 BFT) |
| **Block Time** | ~1 second (default config) |

## Allocation Breakdown

| Category | Percentage | Tokens | Vesting |
|----------|------------|--------|---------|
| **Block Rewards** | 67% | 414,709,913 | Halving every 90,154,327 blocks (~2.8 years at 1 s blocks) |
| **Ecosystem & Grants** | 9% | 55,707,301 | 5-year linear from TGE |
| **Foundation Reserve** | 9% | 55,707,301 | 1-year cliff + 4-year linear |
| **Team & Core Contributors** | 6% | 37,138,201 | 1-year cliff + 3-year linear |
| **Sales (Private + Public)** | 9% | 55,707,301 | 6-month cliff + 18-month linear |

### Block Rewards (67%)

The largest allocation still funds validator incentives and network security. Rewards are minted on each block according to the halving curve; no block rewards are pre-minted.

### Ecosystem & Grants (9%)

Covers grants, DApp incentives, hackathons, bridge integrations, and strategic partnerships. Governance controls the vesting over five years.

### Foundation Reserve (9%)

Supports protocol development, security audits, infrastructure, legal, and operations. This allocation uses a 1-year cliff and 4-year linear unlock.

### Team & Core Contributors (6%)

Aligned to a standard 4-year vesting path with a 1-year cliff and 3 years of linear release.

### Sales (9%)

Private and public fundraising allocation with a 6-month cliff and 18-month linear vesting.

## Emission Schedule

### Parameters

| Parameter | Value |
|-----------|-------|
| **Block Rewards Pool** | 414,709,913 MRSN |
| **Initial Reward per Block** | 2.3 MRSN |
| **Halving Interval** | 90,154,327 blocks |
| **Block Time** | ~1 second (config default) |

### Halving Curve

Rewards follow a Bitcoin-style halving schedule:

| Era | Block Range | Reward/Block | Minted in Era |
|-----|-------------|--------------|---------------|
| 0 | 0 — 90,154,326 | 2.3 MRSN | 207,805,721 |
| 1 | 90,154,327 — 180,308,653 | 1.15 MRSN | 311,708,582 |
| 2 | 180,308,654 — 270,462,980 | 0.576 MRSN | 363,637,474 |
| 3 | 270,462,981 — 360,617,307 | 0.288 MRSN | 389,601,920 |
| 4 | 360,617,308 — 450,771,634 | 0.144 MRSN | 402,584,143 |
| 5 | 450,771,635 — 540,925,961 | 0.072 MRSN | 409,075,255 |
| 6 | 540,925,962 — 631,080,288 | 0.036 MRSN | 412,320,810 |
| ... | (continues halving) | ... | ... |

The geometric series converges to the block-rewards pool of 414,709,913 MRSN:

```
total = initial_reward × halving_interval × 2
      = 2.3 × 90,154,327 × 2
      = 414,709,913 MRSN ✓
```

### Emission Timeline

| Milestone | Era | Approx. Time | Block Rewards Minted | % of Pool |
|-----------|-----|---------------|----------------------|------------|
| First halving | 1 | ~2.8 years | 207,805,721 | 50.0% |
| Second halving | 2 | ~5.6 years | 311,708,582 | 75.0% |
| 87.5% minted | 3 | ~8.4 years | 363,637,474 | 87.5% |
| 93.75% minted | 4 | ~11.2 years | 389,601,920 | 93.75% |
| 96.9% minted | 5 | ~14 years | 402,584,143 | 96.9% |
| **99.2% minted** | **6** | **~16.8 years** | **409,075,255** | **98.4%** |

**99% of block rewards are emitted by approximately year 17 at 1 s blocks.**

## Reward Distribution

Rewards are distributed to all active validators in proportion to their stake:

```
validator_reward = (effective_reward × validator_stake) / total_stake
```

### Example: Equal Stake

With 4 validators each staking 1,000,000 MRSN and a 2.3 MRSN reward per block:

- Total stake = 4,000,000 MRSN
- Each validator receives 2.3 × (1,000,000 / 4,000,000) = **0.575 MRSN per block**

### Supply Cap Enforcement

Before a reward is distributed, the protocol computes:

```
remaining_supply = max_supply - total_minted
effective_reward = min(scheduled_reward, remaining_supply)
```

This guarantees the total minted supply never exceeds the configured cap.

## Summary

| Topic | Summary |
|-------|---------|
| **Max supply** | 618,970,019.642690137449562111 MRSN (2^89 − 1) |
| **Block rewards** | 67% of supply, 2.3 MRSN/block initially |
| **Halving** | Every 90,154,327 blocks (~2.8 years at 1 s blocks) |
| **99% emission** | ~year 17 |
| **Distribution** | Proportional to validator stake |
| **Allocations** | 67% rewards, 9% ecosystem, 9% foundation, 6% team, 9% sales |
