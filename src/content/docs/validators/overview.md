---
title: "Validator Overview"
---

Validators are the backbone of Mersennet. They run full nodes, participate in consensus, produce blocks, and earn block rewards in proportion to their stake. This guide explains what validators do, how the Proof-of-Stake consensus works, and what you need to become one.

## What Validators Do

Validators perform three critical functions:

1. **Block Production**: Validators take turns proposing new blocks containing transactions, order submissions, and state updates. The proposer is selected by deterministic round-robin over the sorted validator set: `validators[(height + round) mod count]`, where `round` advances only on leader timeout.

2. **Consensus Participation**: All validators participate in BFT (Byzantine Fault Tolerant) consensus. Each validator re-executes every proposed block and gossips a signed finality vote for its hash; a block is finalized when votes covering more than 2/3 of total stake have been observed.

3. **Network Security**: By staking MRSN tokens, validators have economic skin in the game. Malicious or negligent behavior is penalized through slashing, which protects the network from attacks and downtime.

## Proof-of-Stake (HotStuff-2 BFT)

Mersennet uses stake-weighted BFT consensus with the following characteristics:

| Aspect | Description |
|--------|-------------|
| **Proposer Selection** | Deterministic round-robin over the validator set, with round-based failover if the leader misses its slot. |
| **Voting Power** | Proportional to staked MRSN. One validator with 2M MRSN has twice the voting power of a validator with 1M MRSN. |
| **Finality Threshold** | >2/3 of total stake must sign a finality vote for a block to be finalized. |
| **Block Time** | ~2 seconds per block. |

:::note
Delegated staking is live via the MersennetStaking precompile at
`0x0000000000000000000000000000000000000400`: any MRSN holder can `delegate`
to a validator, earn a share of its rewards (minus commission), and
`undelegate` / `withdrawUnbonded` after the unbonding period. See the
[Staking Guide](/validators/staking/) for details.
:::

## Block Production

Each block is produced by a single **proposer**, the validator selected for that height. The proposer:

1. Collects transactions from the mempool
2. Executes EVM transactions and MersennetOrders operations
3. Applies state transitions
4. Broadcasts the proposed block to other validators

Other validators re-execute the block and gossip signed votes. Once 2/3+ of stake has voted for its hash, the block is **finalized** and irreversible. There are no chain reorganizations for finalized blocks.

## Earning Rewards

Validators earn **block rewards** in MRSN, distributed proportionally to stake:

```
validator_reward = (block_reward × validator_stake) / total_stake
```

- **Initial reward**: ≈2.3 MRSN per block (2⁶¹ − 1 wei)
- **Halving**: Every 33,550,336 blocks (~2.1 years at ~2 s blocks), the reward halves
- **Distribution**: The validator's share is credited directly each block, with no claiming required; delegator rewards accrue in the staking precompile and are collected via `claimRewards`

The more stake you have (your own + delegations), the larger your share of each block's reward.

## Slashing Risks

Validators can lose stake through **slashing** for consensus violations:

| Offense | Penalty | Consequence |
|---------|---------|-------------|
| **Double-signing** | 5% of stake (base) | **Tombstoned**, permanently banned from the validator set |
| **Downtime / Missed slot** | 1% of stake (base) | **Jailed**, temporarily excluded; can unjail after period |

Penalties **escalate** with repeated offenses (up to 10% max). Double-signing is the most severe: a tombstoned validator cannot rejoin the network.

:::caution
Never run the same validator key on multiple nodes. Double-signing occurs when two nodes with the same key sign different blocks at the same height: this will get you tombstoned.
:::

## Requirements Overview

Before running a validator, ensure you meet:

| Category | Requirement |
|----------|-------------|
| **Hardware** | 4 CPU cores, 8 GB RAM, 100 GB SSD, 100 Mbps network |
| **Software** | 64-bit Linux, glibc 2.34+ (Ubuntu 22.04+ / Debian 12+) for the [release bundle](https://mersennet.com/downloads/); Rust 1.85+ only if building from source |
| **Stake** | Validator set is currently fixed at genesis; permissionless registration (with a minimum stake) is planned |
| **Operational** | 24/7 uptime, monitoring, key management, backup procedures |

See [Run a Validator Node](/validators/run-a-node) for the complete setup guide.
