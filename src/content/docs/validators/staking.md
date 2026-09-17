---
title: "Staking Guide"
---

Staking is how you participate in Mersennet consensus and earn rewards. This guide covers how staking works, rewards, unbonding, and slashing conditions.

## How Staking Works

In Mersennet's Proof-of-Stake model (leader-gated BFT):

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
| `registerValidator(address identity, uint256 selfStakeWei, uint256 commissionBps, bytes proof)` | Register your node as a validator (open set) |
| `addSelfStake(address identity, uint256 amountWei)` | Top up a validator's self-stake |
| `unregisterValidator(address identity)` | Leave the set at the next epoch; self-stake unbonds |
| `rotateValidatorKey(address identity, address newIdentity, bytes proof)` | Switch the block-signing key at the next epoch |

Delegators earn a share of the validator's block rewards (minus validator commission) under an F1-style accounting model. The [explorer's Validators page](https://explorer.mersennet.com/validators) shows each validator's delegated total and commission, and any address page shows its delegations, pending rewards, and unbonding entries. Read methods: `mersennet_staking_getValidators`, `mersennet_staking_getDelegation`, `mersennet_staking_getUnbonding` (see the [RPC reference](/developers/rpc/methods/)).

:::tip[The validator set is open]
Since block 1,348,200 anyone can register a node as a validator. Delegated stake counts toward a validator's ranking: the top 12 by self-stake + delegations form the active set at each hourly epoch. See [Become a Validator](/validators/become-a-validator/).
:::

## Minimum Stake

A validator's minimum **self-stake** is **1,000 MRSN** on the testnet (`validator_set.min_self_stake_mrsn`). Delegations have no minimum beyond a non-zero amount. Mainnet values will be published with the mainnet parameters.

## Rewards

Block rewards are distributed **proportionally to stake**:

```
validator_reward = (block_reward × validator_stake) / total_stake
```

- **Initial block reward**: ≈2.3 MRSN per block (2⁶¹ − 1 wei)
- **Halving**: Every 33,550,336 blocks (~2.1 years at ~2 s blocks)
- **Crediting**: Rewards are applied directly to validator/delegator balances, with no claiming step required

Illustration with four validators of 1M MRSN each (the genesis set; a registered validator with 1,000 MRSN self-stake earns in the same proportion):
- Total stake = 4M MRSN
- Block reward ≈ 2.3058 MRSN
- Each validator receives 2.3058 × (1M / 4M) = **≈0.5765 MRSN per block**

Block rewards are credited to the validator's **operator wallet** from block 1,440,000 (~2026-09-16 13:15 UTC; before that to the node identity); delegators receive their share minus the validator's commission.

## Unbonding Period

When you **unbond** (withdraw) staked MRSN:

1. Your stake is **immediately** removed from voting power.
2. Tokens enter an **unbonding queue** for a fixed number of blocks.
3. After the unbonding period, tokens are returned to your balance.

| Network | Unbonding Period |
|---------|------------------|
| **Testnet** | **7,200 blocks (~4 hours)** — the same for delegations and for a validator's self-stake after `unregisterValidator` |
| **Mainnet** | To be published with the mainnet parameters (expected weeks, not hours) |

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

### Downtime (Missed Leader Slots)

| Aspect | Detail |
|--------|--------|
| **What** | Missing more than **20%** of your leader slots in an epoch (judged only if you had at least 5 slots) |
| **Penalty** | **None on stake.** The validator is **jailed** for the following epoch and returns automatically |
| **Cause** | Node offline, network issues, slow hardware |

Downtime is not slashed on the testnet — the cost is one epoch (one hour) out of the set plus the rewards you did not earn. Keep the node online and upgraded; `mersennet-check` and the staking page show your proposed/missed slots for the current epoch.

## Summary

| Topic | Summary |
|-------|---------|
| **Minimum stake** | 1,000 MRSN self-stake to register as a validator; any amount to delegate |
| **Delegation** | Stake with validators to earn rewards without running a node; counts toward their ranking |
| **Rewards** | Proportional to stake; credited automatically to the validator's operator wallet (from block 1,440,000) |
| **Unbonding** | 7,200 blocks (~4 h) on testnet; tokens locked until the period ends |
| **Slashing** | Double-sign (equivocation) → slashed; downtime → jailed one epoch, no penalty |

For operational details, see [Validator Overview](/validators/overview) and [Monitoring & Alerts](/validators/monitoring).
