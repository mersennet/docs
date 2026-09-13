---
title: "Token Economics"
---

This document provides complete tokenomics documentation for Mersennet (MRSN), including supply, allocation, emission schedule, and validator reward distribution.

## Overview

| Parameter | Value |
|-----------|-------|
| **Token Name** | Mersennet |
| **Ticker** | MRSN |
| **Supply Cap** | 2⁸⁹ − 1 wei ≈ 618,970,019.64 MRSN |
| **Decimals** | 18 |
| **Chain ID** | 8191 (mainnet) · 131071 (testnet) |

Mersennet's constants are chosen from the number theory the network is named for:

- **Supply cap = 2⁸⁹ − 1** (`618970019642690137449562111` wei), a **Mersenne prime**.
- **Initial block reward = 2⁶¹ − 1** (`2305843009213693951` wei ≈ 2.3 MRSN), a **Mersenne prime**.
- **Halving interval = 33,550,336 blocks**, the **5th perfect number**, `2¹² × (2¹³ − 1)`, whose Mersenne factor `2¹³ − 1 = 8191` is the mainnet chain ID.

:::note
These are the protocol's target constants, defined in the node source (`config.rs`) and the genesis config. The current public testnet was bootstrapped with legacy emission parameters and adopts this schedule from its next network upgrade.
:::

### Cap vs. emission: two distinct numbers

The **supply cap** and the **amount actually emitted** are deliberately different:

- The **cap (2⁸⁹ − 1 ≈ 618.97M MRSN)** is a hard protocol ceiling enforced on every block. `total_minted` can never exceed it. It is an *upper bound*, not a target circulating supply.
- **Block-reward emission** follows the halving schedule below and converges to **≈ 154.72M MRSN**, well under the cap. The headroom between emission and the cap absorbs genesis allocations and leaves a permanent safety margin, so the cap is never reached in practice.

## Allocation

MRSN enters circulation two ways: **minted** block rewards (over time) and **genesis** allocations (pre-mined at launch).

| Source | Mechanism | Amount |
|--------|-----------|--------|
| **Block Rewards** | Minted per block on the halving schedule | ≈ 154.72M MRSN over the full schedule (none pre-minted) |
| **Ecosystem & Grants** | Genesis allocation, 5-year linear from TGE | Set at genesis |
| **Foundation Reserve** | Genesis allocation, 1-year cliff + 4-year linear | Set at genesis |
| **Team & Core Contributors** | Genesis allocation, 1-year cliff + 3-year linear | Set at genesis |
| **Sales (Private + Public)** | Genesis allocation, 6-month cliff + 18-month linear | Set at genesis |

:::note
Absolute genesis allocation amounts (and their split across the pre-mine categories) are finalized by the Foundation at genesis. They are bounded by (but no longer derived from) the supply cap, since the cap is a ceiling rather than the target circulating supply. The protocol-enforced facts (cap, block reward, halving) are fixed and stated precisely throughout this page.
:::

### Block Rewards

Validator rewards are **minted on every block** according to the halving schedule; none are pre-minted. Distribution is proportional to validator stake (see [Reward Distribution](#reward-distribution)).

### Genesis allocations

- **Ecosystem & Grants**: developer grants, DApp incentives, hackathons, bridge integrations, and strategic partnerships. Governance-controlled, 5-year linear vesting.
- **Foundation Reserve**: protocol development, security audits, infrastructure, legal, and operations. 1-year cliff + 4-year linear vesting.
- **Team & Core Contributors**: 1-year cliff, then monthly linear unlock over 3 years.
- **Sales**: private and public sale allocation. 6-month cliff + 18-month linear vesting.

## Emission Schedule

### Parameters

| Parameter | Value |
|-----------|-------|
| **Initial Reward per Block** | 2⁶¹ − 1 wei ≈ 2.3 MRSN |
| **Halving Interval** | 33,550,336 blocks |
| **Block Time** | ~2 seconds |
| **Halving Period** | ~2.1 years |
| **Total Emitted (all eras)** | ≈ 154.72M MRSN |

### Halving Epochs

Rewards follow a Bitcoin-style halving schedule (each era spans one halving interval = 33,550,336 blocks):

| Era | Reward/Block (MRSN) | Minted in Era (MRSN) | Cumulative % of Emission |
|-----|---------------------|----------------------|--------------------------|
| 0 | ≈ 2.3058 | ≈ 77,361,808 | 50.0% |
| 1 | ≈ 1.1529 | ≈ 38,680,904 | 75.0% |
| 2 | ≈ 0.5765 | ≈ 19,340,452 | 87.5% |
| 3 | ≈ 0.2882 | ≈ 9,670,226 | 93.75% |
| 4 | ≈ 0.1441 | ≈ 4,835,113 | 96.875% |
| 5 | ≈ 0.0721 | ≈ 2,417,557 | 98.4% |
| ... | (continues halving) | ... | ... |

The geometric series converges to the total emission:

```
total_emission = initial_reward × halving_interval × 2
               = 2.305843009213693951 × 33,550,336 × 2
               ≈ 154,723,615 MRSN
```

This total sits far below the **2⁸⁹ − 1 ≈ 618.97M MRSN** cap: emission never approaches the ceiling.

### Emission Timeline

At ~2 s block time (~2.1 years per halving):

| Milestone | Era | Approx. Time | % of Emission |
|-----------|-----|--------------|---------------|
| First halving | 1 | ~2.1 years | 50.0% |
| Second halving | 2 | ~4.3 years | 75.0% |
| 87.5% emitted | 3 | ~6.4 years | 87.5% |
| 93.75% emitted | 4 | ~8.5 years | 93.75% |
| 96.9% emitted | 5 | ~10.6 years | 96.875% |
| **99%+ emitted** | **7** | **~14.9 years** | **99.2%** |

**99% of block rewards are emitted by approximately year 15** (at ~2 s block time).

## Reward Distribution

Block rewards are distributed to **all active validators** proportionally to their stake:

```
validator_reward = (effective_reward × validator_stake) / total_stake
```

### Example: Equal Stake

Illustration with the four genesis validators (1,000,000 MRSN each; registered validators join the same pro-rata split with their own stake) in era 0 (reward ≈ 2.3058 MRSN/block):

- Total stake = 4,000,000 MRSN
- Block reward ≈ 2.3058 MRSN
- Each validator ≈ 2.3058 × (1,000,000 / 4,000,000) = **≈ 0.5765 MRSN per block**

### Example: Unequal Stake

In era 0 (block reward ≈ 2.3058 MRSN):

| Validator | Stake | Share | Reward/Block (MRSN) |
|-----------|-------|-------|---------------------|
| A | 5,000,000 | 50% | ≈ 1.1529 |
| B | 3,000,000 | 30% | ≈ 0.6918 |
| C | 1,500,000 | 15% | ≈ 0.3459 |
| D | 500,000 | 5% | ≈ 0.1153 |
| **Total** | **10,000,000** | **100%** | **≈ 2.3058** |

### Supply Cap Enforcement

Before distributing any reward, the system checks:

```
remaining_supply = max_supply - total_minted
effective_reward = min(scheduled_reward, remaining_supply)
```

Individual validator rewards are calculated from `effective_reward`. This guarantees `total_minted` never exceeds **2⁸⁹ − 1 wei (≈ 618.97M MRSN)**. In practice the halving schedule converges to ≈ 154.72M MRSN, so the clamp is a hard backstop rather than an active limit.

### Rounding and Burns

Due to integer division with 18-decimal precision, the sum of individual rewards may be slightly less than the effective reward. The difference is **implicitly burned**, typically negligible (0–2 wei per block) but it keeps `total_minted` strictly within the cap.

## Summary

| Topic | Summary |
|-------|---------|
| **Supply cap** | 2⁸⁹ − 1 wei ≈ 618.97M MRSN (hard ceiling, Mersenne prime) |
| **Block reward** | 2⁶¹ − 1 wei ≈ 2.3 MRSN/block initially (Mersenne prime), minted per block |
| **Halving** | Every 33,550,336 blocks (5th perfect number, ~2.1 years at ~2 s blocks) |
| **Total emission** | ≈ 154.72M MRSN (converges well below the cap) |
| **99% emission** | ~year 15 |
| **Distribution** | Proportional to validator stake |
| **Genesis allocations** | Ecosystem, Foundation, Team, Sales (amounts finalized at genesis) |
