---
title: "Become a Validator"
description: "The Mersennet testnet validator set is open: register a node with 1,000 MRSN self-stake, join the active set at the next epoch, produce blocks and earn rewards. Parameters, lifecycle, one-click and raw-precompile registration."
---

The validator set is **permissionless** from block **1,348,200** (2026-09-14, about 08:35 UTC). Any full node whose operator bonds the minimum self-stake can register; from the next epoch it signs blocks and earns block rewards like the genesis validators. Nothing to apply for, nobody to ask.

:::tip[Before you start]
You need a running node with your wallet configured as operator. That is [Step 2 of Run a Node](/validators/run-a-node#step-2--install-one-command) with `--operator 0xYOUR_WALLET`; the node is verified automatically within about ten minutes of being online.
:::

## Parameters (testnet)

| Parameter | Value | Meaning |
|---|---|---|
| Activation | block **1,348,200** (~2026-09-14 08:35 UTC) | Registration and epoch transitions start here. Before that the four genesis validators are the set. |
| Minimum self-stake | **1,000 MRSN** | One faucet claim. Escrowed by the staking precompile when you register. |
| Active set size | **12** | Ranked by self-stake + delegated stake at each epoch boundary. |
| Epoch | **1,800 blocks (1 hour)** | Boundaries at heights divisible by 1,800 (every :00 at 2-second blocks). |
| Joining | register in one epoch → **active from the next** | A registration at 10:20 is active from 11:00. |
| Jailing | miss **>20%** of your leader slots in an epoch (judged only if you had **≥5** slots) | You sit out the **following epoch**; eligible again after that. **No stake is lost.** |
| Leaving | `unregisterValidator` → removed at the next epoch boundary | Self-stake unbonds for **7,200 blocks (~4 hours)**, then `withdrawUnbonded()` returns it. |
| Key rotation | `rotateValidatorKey` with a proof from the new node key | Effective at the next epoch; delegations follow the validator. |
| Commission | 0–100% in basis points, set at registration | Share of block rewards kept from delegators. |
| Slashing | **only for equivocation** (voting for two blocks at one height), 5% | Downtime is never slashed on this testnet — it is jailed. |
| Rewards | block rewards accrue to the **operator wallet** from block **1,440,000** (~2026-09-16 13:15 UTC) | Until then they accrue to the node identity (the node key). The switch is a consensus parameter (`validator_set.rewards_to_operator_height`); nothing to do on your side. |

Unbonding of *delegated* stake also takes 7,200 blocks, so one number applies everywhere: about four hours.

## Lifecycle

| From | Event | To |
|---|---|---|
| — | `registerValidator` with ≥ 1,000 MRSN | **pending** |
| pending | next epoch boundary, ranked in the top 12 | **active** |
| pending | next epoch boundary, ranked below the top 12 | **standby** |
| standby | more self-stake or delegations at a boundary | **active** |
| active | outranked at a boundary | **standby** |
| active | missed > 20% of ≥ 5 slots in the epoch | **jailed** (one epoch) |
| jailed | one epoch later | **active** or **standby** by rank |
| active / standby | `unregisterValidator` | **exiting** |
| exiting | next epoch boundary | removed; self-stake unbonds 7,200 blocks |

| Status | Shown as | What it means |
|---|---|---|
| `pending` | yellow | Registered this epoch; eligible from the next boundary. |
| `active` | green | In the consensus set: your node signs blocks when the schedule makes it leader and votes on every height. |
| `standby` | grey | Eligible but ranked below the top 12. Add self-stake or attract delegations. |
| `jailed` | red | Missed too many slots last epoch; excluded for this epoch, back automatically. |
| `exiting` | grey | Leaving at the next boundary. |

The active set is recomputed **deterministically from chain state** at every epoch boundary; every node derives the same set, so there is no coordinator.

## Register from the terminal (one click)

1. Open [trade.mersennet.com/staking](https://trade.mersennet.com/staking) with the operator wallet.
2. Under **Validator set → Register a node** your verified node is listed (host, identity, build). Choose the self-stake (≥ 1,000 MRSN) and a commission.
3. Press **Bond & register**. One transaction: the terminal already holds your node's signed proof, so there is nothing to copy.
4. The table shows your entry as **pending**, then **active** at the next :00. Missed and proposed slots for the current epoch are live.

From the same panel you can **Add stake** or **Unregister**; delegators use the staking table above it.

## Register without the terminal

The staking precompile at `0x0000000000000000000000000000000000000400` exposes:

```text
registerValidator(address identity, uint256 selfStakeWei, uint256 commissionBps, bytes proof) returns (bool)
addSelfStake(address identity, uint256 amountWei) returns (bool)
unregisterValidator(address identity) returns (bool)
rotateValidatorKey(address identity, address newIdentity, bytes proof) returns (bool)
withdrawUnbonded() returns (uint256 paid)
```

`identity` is the node's block-signing address and `proof` its signature over the registration statement for *your* wallet. Your node prints both:

```bash
curl -s localhost:8545 -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"mersennet_nodeIdentity","params":[]}'
# → {"identity":"0x…","operator":"0x…","registrationProof":"0x…","version":"Mersennet/0.7.0-…"}
```

The proof only binds *identity → operator*. It authorises nothing else, so it is safe to share; the precompile rejects a proof signed for a different wallet. The statement it signs is:

```text
Mersennet validator registration v1
operator: 0x<your wallet, lowercase>
identity: 0x<node identity, lowercase>
```

Example with [cast](https://book.getfoundry.sh/cast/):

```bash
cast send 0x0000000000000000000000000000000000000400 \
  "registerValidator(address,uint256,uint256,bytes)" \
  0xNODE_IDENTITY 1000000000000000000000 500 0xPROOF \
  --rpc-url https://rpc.mersennet.com --private-key $OPERATOR_KEY
```

## Reading the set

`mersennet_validatorSet` returns the parameters, the current epoch, the next boundary, the active set and every registration with its status:

```bash
curl -s https://rpc.mersennet.com -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"mersennet_validatorSet","params":[]}'
```

The [explorer's Validators page](https://explorer.mersennet.com/#/validators) renders the same data; `mersennet-check` on your server prints your node's identity and status.

## Running well

- **Stay online.** A validator that is down costs everyone 19 seconds per missed slot until the epoch boundary jails it. Restart quickly after upgrades (`sudo systemctl restart mersennet` is graceful; the node finishes its in-flight block).
- **Upgrade when `mersennet-check` says so.** Re-running the installer keeps your keys, data and operator setting and refreshes the consensus sections of the config from the canonical one.
- **Back up `keys/node_key.json`.** It *is* your validator identity. If it leaks, rotate with `rotateValidatorKey` from a fresh node.
- **Watch your slots** on the staking page or the explorer: `proposed / missed` for the current epoch tells you whether the network hears you.

## Frequently asked

**Do I need 1,000,000 MRSN like the genesis validators?** No. Their stake was written into the genesis file; the minimum for everyone else is 1,000 MRSN.

**My node is verified but not in the validator list.** Verification (points, explorer badge) and registration are separate steps. Register on the staking page; you appear as `pending` immediately and `active` at the next hour.

**Can I run several validators?** Yes, one registration per node identity, each with its own self-stake. For node-runner points only one node per operator counts.

**What happens to my delegators if I leave?** Their stake stops earning at the boundary where you are removed and unbonds on their side with `undelegate`.
