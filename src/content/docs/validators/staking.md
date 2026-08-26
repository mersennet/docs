---
title: "Staking Guide"
---

Staking is how you participate in Mersennet consensus and earn rewards. This guide covers how staking works, rewards, unbonding, and slashing conditions.

## How Staking Works

In Mersennet's Proof-of-Stake model (HotStuff-2 BFT):

1. **Validators** stake MRSN to join the validator set and produce blocks.
2. **Voting power** is proportional to stake.
3. **Block rewards** are distributed to all active validators proportionally to their stake.

## Delegated Staking (Live)

Delegation — staking MRSN with an existing validator without running a node — is **live on the testnet** via the `MersennetStaking` precompile at `0x0000000000000000000000000000000000000400`:

| Function | Effect |
|----------|--------|
| `delegate(address validator, uint256 amount)` | Bond `amount` wei of MRSN to a validator's pool |
| `undelegate(address validator, uint256 amount)` | Start unbonding; principal stops earning immediately |
| `claimRewards(address validator)` | Claim accrued rewards to your balance |
| `withdrawUnbonded()` | Withdraw principal whose unbonding period has elapsed |

Delegators earn a share of the validator's block rewards (minus validator commission) under an F1-style accounting model. The [explorer's Validators page](https://explorer.mersennet.com/validators) shows each validator's delegated total and commission, and any address page shows its delegations, pending rewards, and unbonding entries. Read methods: `mersennet_staking_getValidators`, `mersennet_staking_getDelegation`, `mersennet_staking_getUnbonding` (see the [RPC reference](/developers/rpc/methods/)).

:::note
Joining the **validator set** itself is not yet permissionless — see [Run a Node](/validators/run-a-node/#becoming-a-validator).
:::

## Minimum Stake

The minimum stake to register as a validator is set by governance. As of the current testnet, any non-zero amount may be accepted. Check the latest network parameters for production mainnet.

## Rewards

Block rewards are distributed **proportionally to stake**:

```
validator_reward = (block_reward × validator_stake) / total_stake
```

- **Initial block reward**: ≈2.3 MRSN per block (2⁶¹ − 1 wei)
- **Halving**: Every 33,550,336 blocks (~2.1 years at ~2 s blocks)
- **Crediting**: Rewards are applied directly to validator/delegator balances, with no claiming step required

Example with 4 validators each staking 1M MRSN (era 0, reward ≈2.3058 MRSN):
- Total stake = 4M MRSN
- Block reward ≈ 2.3058 MRSN
- Each validator receives 2.3058 × (1M / 4M) = **≈0.5765 MRSN per block**

## Unbonding Period

When you **unbond** (withdraw) staked MRSN:

1. Your stake is **immediately** removed from voting power.
2. Tokens enter an **unbonding queue** for a fixed number of blocks.
3. After the unbonding period, tokens are returned to your balance.

| Network | Unbonding Period |
|---------|------------------|
| **Testnet** | 100 blocks (per the shipped testnet configs; the code default is 2) |
| **Mainnet** | 100 blocks at genesis; governance-configurable |

:::note
During unbonding, your tokens can still be slashed if the validator commits an offense. Only after the unbonding period completes are tokens safely returned.
:::

## Slashing Conditions

Validators (and their delegators) can lose stake through slashing:

### Double-Signing

| Aspect | Detail |
|--------|--------|
| **What** | Signing two different blocks at the same height |
| **Base penalty** | 5% of stake |
| **Consequence** | **Tombstoned**, permanently banned from the validator set |
| **Cause** | Running the same validator key on multiple nodes |

:::danger
Double-signing is permanent. A tombstoned validator cannot rejoin. Never duplicate your validator key across nodes.
:::

### Downtime (Missed Production Slot)

| Aspect | Detail |
|--------|--------|
| **What** | Failing to produce a block when elected leader (or persistent failure to vote) |
| **Base penalty** | 1% of stake |
| **Consequence** | **Jailed**, temporarily excluded; can unjail after jail period |
| **Cause** | Node offline, network issues, slow hardware |

Penalties **escalate** with repeated offenses (e.g. +0.25% per offense, capped at 10%). Maintain high uptime and monitoring to avoid downtime slashing.

## Summary

| Topic | Summary |
|-------|---------|
| **Minimum stake** | Set by governance; check network params |
| **Delegation** | Stake with validators to earn rewards without running a node |
| **Rewards** | Proportional to stake; credited automatically |
| **Unbonding** | 100 blocks on testnet; tokens locked until period ends |
| **Slashing** | Double-sign → tombstoned; downtime → jailed + penalty |

For operational details, see [Validator Overview](/validators/overview) and [Monitoring & Alerts](/validators/monitoring).
