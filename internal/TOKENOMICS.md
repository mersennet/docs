# Mersennet (MRSN) Tokenomics

Complete technical documentation of MRSN token economics, emission schedule, allocations, validator incentives, and slashing mechanics.

---

## 1. Overview

| Parameter | Value |
|-----------|-------|
| **Token Name** | Mersennet |
| **Ticker** | MRSN |
| **Supply Cap** | 2⁸⁹ − 1 wei = 618,970,019,642,690,137,449,562,111 wei ≈ 618.97M MRSN (Mersenne prime; hard ceiling, not the circulating target) |
| **Decimal Places** | 18 (1 MRSN = 10^18 wei) |
| **Consensus** | Proof-of-Stake (HotStuff-2 BFT) |
| **Block Time** | ~1 second (default) |

---

## 2. Token Allocation

MRSN enters circulation two ways: **minted** block rewards (over time) and **genesis** allocations (pre-mined at launch). Absolute genesis amounts are finalized by the Foundation at genesis — they are bounded by, but no longer derived from, the supply cap, since the cap is a ceiling rather than the target circulating supply.

| Source | Mechanism | Amount | Vesting Schedule |
|--------|-----------|--------|-----------------|
| **Block Rewards** | Minted per block on the halving schedule | ≈154.72M MRSN over the full schedule (none pre-minted) | Halving every 33,550,336 blocks (~1.06 years at 1 s blocks) (see §3) |
| **Ecosystem & Grants** | Genesis allocation | Set at genesis | 5-year linear from TGE |
| **Foundation Reserve** | Genesis allocation | Set at genesis | 1-year cliff + 4-year linear |
| **Team & Core Contributors** | Genesis allocation | Set at genesis | 1-year cliff + 3-year linear |
| **Sales (Private + Public)** | Genesis allocation | Set at genesis | 6-month cliff + 18-month linear |

### 2.1 Block Rewards

Validator rewards are minted on every block according to the halving schedule (§3) and distributed proportionally to validator stake. No block rewards are pre-minted — they are created as each block is produced. Total block-reward emission converges to ≈154.72M MRSN, well below the 2⁸⁹ − 1 wei (≈618.97M MRSN) cap.

### 2.2 Ecosystem & Grants

Funds developer grants, DApp incentives, hackathons, bridge integrations, and strategic partnerships. Controlled by governance with a 5-year linear vesting to prevent dumping.

### 2.3 Foundation Reserve

Protocol development, security audits, infrastructure costs, legal, and operational runway. Subject to a 1-year cliff followed by 4-year linear vesting.

### 2.4 Team & Core Contributors

Aligned with standard 4-year vesting: no tokens for the first year (cliff), then monthly linear unlock over the remaining 3 years. Ensures long-term commitment.

### 2.5 Sales

Combined private and public sale allocation for fundraising. 6-month cliff followed by 18-month linear vesting. This conservative unlock protects early token price stability.

---

## 3. Block Reward Emission Schedule

### 3.1 Parameters

| Parameter | Value |
|-----------|-------|
| **Total Emission (all eras)** | ≈154.72M MRSN (converges well below the cap) |
| **Initial Reward** | 2⁶¹ − 1 wei = 2,305,843,009,213,693,951 wei ≈ 2.3 MRSN per block (Mersenne prime) |
| **Halving Interval** | 33,550,336 blocks — the 5th perfect number, 2¹² × (2¹³ − 1) (~1.06 years at the 1 s default block time) |
| **Block Time** | ~1 second (config default; mainnet genesis currently specifies 200 ms — see note below) |

### 3.2 Halving Curve

Rewards follow a Bitcoin-style halving schedule (each era spans one halving interval = 33,550,336 blocks):

```
Era   Reward/Block (MRSN)   Minted in Era (MRSN)
───   ───────────────────   ────────────────────
0     ≈ 2.3058              ≈ 77,361,808
1     ≈ 1.1529              ≈ 38,680,904
2     ≈ 0.5765              ≈ 19,340,452
3     ≈ 0.2882              ≈  9,670,226
4     ≈ 0.1441              ≈  4,835,113
5     ≈ 0.0721              ≈  2,417,557
...   (continues halving)   ...
```

The geometric series converges to the total emission:

```
total_emission = initial_reward × halving_interval × 2
               = 2.305843009213693951 × 33,550,336 × 2
               ≈ 154,723,615 MRSN
```

This total sits far below the 2⁸⁹ − 1 wei (≈618.97M MRSN) cap — emission never approaches the ceiling.

### 3.3 Emission Timeline

Times below assume the 1 s default block time (`block_time_ms: 1000`, the config default also used by the testnet configs); each halving interval is ~1.06 years.

| Milestone | Era | Approximate Time | % of Emission |
|-----------|-----|-----------------|---------------|
| First halving | 1 | ~1.1 years | 50.0% |
| Second halving | 2 | ~2.1 years | 75.0% |
| 87.5% emitted | 3 | ~3.2 years | 87.5% |
| 93.75% emitted | 4 | ~4.3 years | 93.75% |
| 96.9% emitted | 5 | ~5.3 years | 96.875% |
| **99%+ emitted** | **7** | **~7.4 years** | **99.2%** |

**99% of block rewards are emitted by approximately year 7–8 at 1 s blocks.** The supply cap enforces a hard ceiling — if somehow the remaining supply is less than the scheduled reward, only the remainder is distributed. In practice the converging emission never approaches the cap.

> **Note — block-time dependence:** the emission schedule is defined in blocks, so wall-clock timing scales with the configured block time. `mainnet/genesis.json` currently specifies `block_time_ms: 200`, which would compress the schedule 5x (first halving in ~78 days). The mainnet block time and/or halving interval should be reconciled before launch.

### 3.4 Supply Cap Enforcement

Before distributing any reward, the system checks:

```
remaining_supply = max_supply - total_minted
effective_reward = min(scheduled_reward, remaining_supply)
```

Individual validator rewards are calculated from `effective_reward`, not the scheduled reward, ensuring `total_minted` can never exceed `max_supply`.

### 3.5 Implementation

```rust
pub fn reward_per_block(&self, height: u64) -> U256 {
    let halvings = height / self.halving_interval;
    let mut reward = self.initial_reward_per_block;
    for _ in 0..halvings {
        reward = reward / 2;
        if reward.is_zero() { break; }
    }
    reward
}
```

---

## 4. Reward Distribution

### 4.1 Stake-Proportional Split

Block rewards are distributed to **all active validators** proportional to their stake:

```
validator_reward = (effective_reward × validator_stake) / total_stake
```

**Example with 4 equal-stake validators (era 0, reward ≈2.3058 MRSN/block):**

```
total_stake    = 4,000,000 MRSN (1M each)
reward/block   ≈ 2.3058 MRSN
each validator ≈ 2.3058 × 1,000,000 / 4,000,000 ≈ 0.5765 MRSN per block
```

### 4.2 Unequal Stake Example

In era 0 (block reward ≈ 2.3058 MRSN):

```
Validator A: 5M stake → 5/10 = 50% of reward ≈ 1.1529 MRSN
Validator B: 3M stake → 3/10 = 30% of reward ≈ 0.6918 MRSN
Validator C: 1.5M stake → 1.5/10 = 15% of reward ≈ 0.3459 MRSN
Validator D: 0.5M stake → 0.5/10 =  5% of reward ≈ 0.1153 MRSN
                                                    ─────────
                                                    ≈ 2.3058 MRSN
```

### 4.3 Rounding and Burns

Due to integer division with 18-decimal precision, the sum of individual rewards may be slightly less than the effective reward. The difference is **implicitly burned**:

```
total_distributed = sum(all validator rewards)
burned_reward     = effective_reward - total_distributed
```

This burn is negligible (typically 0-2 wei per block) but ensures no tokens are created beyond the cap.

### 4.4 How Rewards Are Applied

Rewards are credited directly to each validator's account balance — no lockup, no vesting, no claiming required:

```rust
fn apply_rewards(&mut self, rewards: &[Reward]) -> Result<()> {
    for reward in rewards {
        let mut info = self.evm.db.basic(reward.address)?;
        info.balance += reward.amount;
        self.evm.db.insert_account_info(reward.address, info);
    }
}
```

---

## 5. Validator Economics

### 5.1 Becoming a Validator

To become a validator, an address must stake MRSN tokens:

```rust
engine.add_validator(address, stake)
```

- **Minimum stake:** Any non-zero amount (governance may set higher minimums)
- **Multiple stakes:** A validator can increase stake with additional `stake()` calls
- **New validators** are added via `pending_changes` and applied at the next block

### 5.2 Unbonding

Validators can withdraw stake, subject to an **unbonding period**:

```
unbonding_period = 2 blocks (testnet default, governance-adjustable)
```

When a validator unbonds:
1. Stake is immediately deducted from their voting power
2. Tokens are locked for `unbonding_period` blocks
3. After the period, tokens are returned to the validator's balance
4. During unbonding, tokens can still be slashed

### 5.3 Proposer Selection

The block proposer rotates using a **weighted round-robin** algorithm:

```
proposer = validator with highest priority
priority[i] += normalized_weight[i]   (each round)
priority[proposer] -= total_weight     (after selection)
```

Weights are normalized to prevent overflow with 18-decimal stake values. Validators propose blocks proportionally to their stake, identical to Tendermint/CometBFT.

### 5.4 Estimated Validator APY

At genesis with 4 validators (1M MRSN staked each):

```
blocks/year       ≈ 31,536,000 (at 1s block time)
reward/block      ≈ 2.3058 MRSN (era 0)
validator/block   ≈ 0.5765 MRSN (with 4 equal validators)
annual/validator  ≈ 0.5765 × 31,536,000 ≈ 18,180,000 MRSN
APY               ≈ 18,180,000 / 1,000,000 ≈ 1,818%
```

This high initial APY incentivizes early staking. As more validators join and total stake increases, APY decreases proportionally. As halvings occur, the reward rate drops further.

---

## 6. Slashing

### 6.1 Offense Types

| Offense | Base Penalty (bps) | Description |
|---------|-------------------|-------------|
| **Double Sign** | 500 (5%) | Signing two different blocks at the same height |
| **Precommit Timeout** | 100 (1%) | Failing to precommit in a consensus round |

*bps = basis points. 100 bps = 1%.*

### 6.2 Escalation

Penalties **escalate** with repeated offenses:

```
actual_penalty = base_bps + (escalation_step × offense_count) + (escalation_step × rounds_missed)
actual_penalty = min(actual_penalty, max_escalation_bps)
```

With defaults:
```
escalation_step  = 25 bps (0.25%)
max_escalation   = 1000 bps (10%)

First timeout:   100 bps = 1%
Second timeout:  125 bps = 1.25%
Third timeout:   150 bps = 1.5%
...
Cap at:          1000 bps = 10%
```

### 6.3 Slashing Source Priority

When slashing occurs, tokens are taken from:
1. **Unbonding queue first** — tokens being withdrawn
2. **Active stake second** — if unbonding doesn't cover it
3. **Remainder burned** — if the validator doesn't have enough

### 6.4 Jail and Tombstone

| State | Meaning | Recovery |
|-------|---------|----------|
| **Jailed** | Temporarily excluded from consensus | Can `unjail()` after jail period |
| **Tombstoned** | Permanently banned | Cannot rejoin, cannot stake |

- Double-signing → **tombstoned** (permanent)
- Repeated timeouts → **jailed** (temporary)
- Tombstoned validators cannot re-stake or participate ever again

### 6.5 Evidence Expiration

Slashing evidence has a **max age** (default: 10,000 blocks). Evidence older than this is ignored, preventing ancient history from being used to slash validators.

---

## 7. Consensus Economics

### 7.1 BFT Finality

- **Threshold:** >2/3 of total stake required to finalize a block
- **With 4 equal validators:** need 3 of 4 (tolerates 1 failure)
- **Finalized blocks are irreversible** — no chain reorganizations

### 7.2 Block Structure (economic fields)

Every block includes:

```json
{
  "number": 1000,
  "rewards": [
    { "address": "0x5b86...", "amount": "576460752303423487" },
    { "address": "0x4139...", "amount": "576460752303423487" },
    { "address": "0xf7de...", "amount": "576460752303423487" },
    { "address": "0x3314...", "amount": "576460752303423487" }
  ],
  "total_reward": "2305843009213693948",
  "burned_reward": "3",
  "scheduled_reward": "2305843009213693951",
  "remaining_supply": "618970017336847128235868163"
}
```

### 7.3 EIP-1559 Fee Market

Mersennet implements EIP-1559 base fee adjustment:

```
gas_limit_per_block     = 30,000,000
fee_elasticity          = 2x
max_change_denominator  = 8  (12.5% max change per block)
```

- **Base fee** adjusts up when blocks are >50% full, down when <50%
- Transaction fees are **not** given to validators (implicitly burned by gas accounting)
- Validators earn exclusively from block rewards, not gas fees

---

## 8. Governance

Token economics parameters can be changed via **on-chain governance**:

| Parameter | Governance Changeable |
|-----------|----------------------|
| Gas limit per block | Yes (`SetFeeMarket` proposal) |
| Fee elasticity | Yes |
| Max supply | Yes (`SetTokenEconomics` proposal) |
| Reward per block | Yes |
| Halving interval | Yes |

Governance requires:
- **Quorum:** 60% of total stake must vote
- **Pass threshold:** 50% of votes must be `yes`
- **Voting power** = validator stake

---

## 9. Comparison to Other L1s

| Chain | Total Supply / Cap | Block Rewards | Team | Investors | Ecosystem | 99% Emitted |
|-------|-------------|--------------|------|-----------|-----------|-------------|
| **Bitcoin** | 21M | 100% | 0% | 0% | 0% | ~25 years |
| **Avalanche** | 720M | 50% | 20% | 4% | 19% | ~10 years |
| **Cosmos** | ~750M | 68.5% | 3.2% | 3.8% | 3.1% | Perpetual |
| **Celestia** | 1B | (inflation) | 17.6% | 35.6% | 26.8% | Perpetual |
| **Polkadot** | 2.1B | Halving | ~5% | ~13% | ~17% | ~12+ years |
| **MRSN** | **2⁸⁹−1 wei (≈618.97M cap)** | **≈154.72M emitted** | **genesis alloc.** | **genesis alloc.** | **genesis alloc.** | **~7–8 years** |

Mersennet pairs a Mersenne-prime supply cap (a hard ceiling, not a circulating target) with Bitcoin/Polkadot-style halving discipline; block-reward emission converges to ≈154.72M MRSN, with the remaining genesis allocations finalized at genesis.

---

## 10. Configuration Reference

All token economics are set via the node config JSON:

```json
{
  "token_economics": {
    "max_supply": "618970019642690137449562111",
    "initial_reward_per_block": "2305843009213693951",
    "halving_interval": 33550336
  },
  "slashing": {
    "double_sign_bps": 500,
    "timeout_bps": 100,
    "escalation_step_bps": 25,
    "escalation_max_bps": 1000,
    "round_timeout_ms": 500,
    "unbonding_period": 2
  }
}
```

---

## 11. Source Code Reference

| Component | File |
|-----------|------|
| Reward calculation | `crates/core/src/consensus.rs` → `reward_per_block()`, `finalize()` |
| Reward application | `crates/core/src/engine.rs` → `apply_rewards()` |
| Slashing logic | `crates/core/src/consensus.rs` → `slash_amount_for_evidence()` |
| Unbonding | `crates/core/src/consensus.rs` → `unbond()`, `process_unbonding()` |
| Proposer selection | `crates/core/src/consensus.rs` → `proposer()` |
| Fee market | `crates/core/src/engine.rs` → `set_fee_market_params()` |
| Governance | `crates/core/src/governance.rs` |
| Config defaults | `crates/core/src/config.rs` → `TokenEconomicsConfig` |
