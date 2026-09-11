---
title: "Consensus Mechanism"
---

Mersennet uses **leader-gated Proof-of-Stake BFT** (HotStuff-2 style): one elected validator produces each block, every validator re-executes it, and signed finality votes gossip across the network until a 2/3-stake quorum finalizes the height. This document is a deep dive into how consensus works, from leader election to finalization and slashing.

## Overview

| Parameter | Value |
|-----------|-------|
| **Consensus** | Proof-of-Stake BFT, single elected leader per height |
| **Block Time** | ~2 seconds on the current testnet (configurable per network) |
| **Finality** | ≥ 2/3 of total stake, signed votes gossiped per block |
| **Failover** | Timeout-based round rotation to the next leader |
| **Implementation** | Rust |

## Validator Selection

Validators are nodes with MRSN staked in the genesis validator set. Voting power is proportional to stake:

```
voting_power(validator) ∝ staked_amount
```

Token holders can **delegate** their MRSN to validators via the staking precompile, increasing that validator's voting power. Permissionless runtime validator registration is planned (precompile selectors are reserved) but not yet enabled; the current set is fixed at genesis.

## Leader Election

Exactly one validator is elected to produce each block. Election is deterministic round-robin over the validator set:

```
leader(height, round) = validators[(height + round) mod validator_count]
```

- `round` starts at 0 for every height. If the elected leader fails to produce a block within the round timeout, every node independently advances to `round + 1`, which rotates leadership to the next validator — no coordinator required.
- Because the formula is pure, every node computes the same leader for the same `(height, round)` — non-leaders simply wait, import, and vote.

This gives:

- **Liveness under failure**: A crashed leader delays its height by one timeout, then the next validator takes over.
- **Fair rotation**: Each validator leads an equal share of heights.
- **Determinism**: No leader ambiguity, so no competing blocks under normal operation.

## Block Production Cycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     BLOCK PRODUCTION CYCLE                              │
└─────────────────────────────────────────────────────────────────────────┘

  Height N
    │
    │  1. LEADER ELECTION
    │     └─ leader = validators[(N + round) mod count]
    │
    │  2. PROPOSAL
    │     └─ Leader pulls txs from its mempool, executes the block,
    │        computes the content-committing block hash, and gossips it
    │
    │  3. IMPORT & RE-EXECUTION
    │     └─ Every other node re-executes the block's transactions
    │        against its own state and verifies the parent-hash link
    │
    │  4. VOTE
    │     └─ Each validator signs a finality vote over (height, block_hash)
    │        and gossips it on the "vote" topic
    │
    │  5. FINALIZATION
    │     └─ When votes covering ≥ 2/3 of total stake accumulate,
    │        the height is finalized — rewards and state are committed
    │
    ▼
  Height N+1
```

### Content-Committing Block Hash

The block hash commits to the block's actual content — `parent_hash`, `timestamp`, `transactions_root`, `state_root`, `receipts_root`, gas usage, and transaction count — so a vote for a hash is a vote for the exact state transition, and every block is hash-linked to its parent. Imports reject any block whose `parent_hash` does not match the local head.

## Block Finalization

A block is **finalized** when signed votes from validators representing more than 2/3 of total stake have been observed for its hash:

```
T = 2/3 × total_stake + 1
finalized ⟺ Σ stake(voters for block_hash) ≥ T
```

Votes are ECDSA signatures over a domain-separated digest of `(height, block_hash)`; each receiving node recovers the signer, checks it against the validator set, and accumulates stake until quorum. Finalized blocks are **irreversible** — there are no chain reorganizations.

## Validator-Set Updates

Validator-set changes (stake changes, unbonding completions, slashes) are queued and applied at each block boundary; there is no separate epoch schedule. Unbonded stake becomes withdrawable `unbonding_period` blocks after the unbond.

## Slashing Mechanism

### Slashing Types

| Type | Trigger | Base Penalty | Consequence |
|------|---------|--------------|-------------|
| **Double-sign** | Signing two different blocks at same height | 5% of stake | **Tombstoned** (permanent ban) |
| **Timeout** | Missing your production slot as elected leader | 1% of stake | **Jailed** (temporary exclusion) |

### Escalation

Penalties **escalate** with repeated offenses:

```
actual_penalty = base_bps + (escalation_step × offense_count) + (escalation_step × (rounds_missed − 1))
# rounds_missed is floored at 1, so the first missed round adds no escalation
actual_penalty = min(actual_penalty, max_escalation_bps)
```

With default parameters:
- `escalation_step` = 25 bps (0.25%)
- `max_escalation` = 1000 bps (10%)

First timeout: 1%. Second: 1.25%. Third: 1.5%. And so on, up to 10%.

### Slashing Source Priority

When slashing is executed, tokens are taken from:
1. **Unbonding queue first**, the tokens being withdrawn
2. **Active stake second**, if unbonding doesn't cover the penalty
3. **Remainder burned**, if the validator doesn't have enough to cover

### Tombstone vs. Jail

- **Tombstoned**: Permanently banned. Cannot rejoin.
- **Jailed**: Temporarily excluded. Can `unjail()` after the jail period.

## Block Structure

Every finalized block contains the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `number` | `u64` | Sequential block height starting from 0 (genesis) |
| `hash` | `B256` | Content-committing Keccak-256 hash (binds parent, roots, timestamp) |
| `parent_hash` | `B256` | Hash of the previous block — imports reject broken links |
| `chain_id` | `u64` | Network identifier (131071 for testnet) |
| `state_root` | `B256` | Merkle root of the post-execution state trie |
| `transactions` | `Vec<Transaction>` | Ordered list of transactions included in the block |
| `receipts` | `Vec<Receipt>` | Execution receipts corresponding 1:1 with transactions |
| `proposer` | `Address` | Validator address that proposed this block |
| `coinbase` | `Address` | Address receiving block rewards (same as proposer) |
| `gas_limit` | `u64` | Maximum gas allowed in this block (default 30,000,000) |
| `gas_used` | `u64` | Total gas consumed by all transactions |
| `base_fee` | `U256` | EIP-1559 base fee for this block (adjusts per block) |
| `finalized` | `bool` | Whether 2/3+ stake committed to this block |
| `consensus` | `Finalization` | BFT finalization data (vote summary, round info) |
| `rewards` | `Vec<Reward>` | Per-validator block reward distributions |
| `total_reward` | `U256` | Sum of all rewards paid this block |
| `burned_reward` | `U256` | Portion of rewards burned (e.g. slashed stake) |
| `slashes` | `Vec<Slashing>` | Slashing events applied in this block |
| `unbonded` | `Vec<Unbonding>` | Completed unbonding operations |
| `domain_events` | `Vec<DomainEvent>` | MersennetOrders and bridge events emitted during execution |

### Receipt Format

Each transaction produces a `Receipt`:

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | Whether the transaction executed without revert |
| `gas_used` | `u64` | Gas consumed by this transaction |
| `output` | `Bytes` | Return data (ABI-encoded for contract calls) |
| `created_address` | `Option<Address>` | Contract address if this was a deployment |
| `error` | `Option<String>` | Human-readable error message on failure |
| `logs` | `Vec<LogEntry>` | Emitted EVM logs (events) |

## Transaction Lifecycle

A transaction moves through the following stages from submission to finalization:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TRANSACTION LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────────┘

  1. SUBMISSION
     │  Client sends signed transaction via JSON-RPC
     │  (eth_sendRawTransaction or mersennet_sendTransaction)
     │
  2. VALIDATION
     │  ├─ Verify ECDSA signature (recover signer from r, s, v)
     │  ├─ Check chain_id matches (131071 for testnet)
     │  ├─ Verify nonce == account.nonce (no gaps, no replays)
     │  ├─ Verify sender balance ≥ value + gas_limit × gas_price
     │  └─ Check gas_price ≥ base_fee (EIP-1559)
     │
  3. MEMPOOL
     │  ├─ Insert into pending pool (max 10,000 total txs)
     │  ├─ Per-sender limit: 1,000 pending txs
     │  ├─ Replacement: new tx must bump gas_price by ≥10% (1000 bps)
     │  └─ Gossip transaction hash to connected peers
     │
  4. BLOCK INCLUSION
     │  ├─ Proposer gathers txs from mempool ordered by gas_price
     │  ├─ Txs included up to block gas_limit (30M gas)
     │  └─ Proposer builds candidate block
     │
  5. EVM EXECUTION
     │  ├─ Execute each tx sequentially in revm
     │  ├─ Apply state transitions (balance changes, storage writes)
     │  ├─ Process MersennetOrders precompile calls (if any)
     │  ├─ Generate receipt with logs, gas_used, status
     │  └─ Compute post-execution state_root
     │
  6. CONSENSUS & FINALIZATION
     │  ├─ Leader gossips the block; every node re-executes it
     │  ├─ Each validator signs a vote over (height, block_hash)
     │  └─ On ≥ 2/3 stake voting for the hash, the block is final
     │
  7. RECEIPT
     └─ Client queries receipt via eth_getTransactionReceipt
        Receipt includes: status, gas_used, logs, created_address
```

### Nonce Management

Nonces enforce strict transaction ordering per account:

- Each account has a monotonically increasing nonce starting at 0
- Transaction with nonce `N` can only execute when the account's current nonce is `N`
- If nonce `N+1` arrives before `N`, it stays in the mempool queue until `N` executes
- Sending a new transaction with the same nonce replaces the pending one (if gas price is bumped by ≥10%)

## State Management

Mersennet maintains EVM-compatible world state using a Merkle trie structure.

### State Trie

The world state is a mapping from addresses to account objects:

```
State Root (B256)
    │
    ├── Account 0x1234...
    │   ├── nonce: u64
    │   ├── balance: U256
    │   ├── code_hash: B256 (keccak256 of contract bytecode)
    │   └── storage_root: B256 (root of account's storage trie)
    │
    ├── Account 0x5678...
    │   └── ...
    │
    └── ...
```

Each block produces a new `state_root`, the Merkle root computed over all account state after executing every transaction. This provides:

- **Integrity verification**: Any node can verify state correctness by recomputing the root
- **Light client proofs**: Merkle proofs can prove account balances without full state
- **Determinism**: Same transactions on same pre-state always produce the same state root

### Storage Model

Account storage follows the EVM model: each contract has a 256-bit key → 256-bit value mapping. Storage slots are accessed via `SLOAD` and `SSTORE` opcodes.

The current storage backend options are:

| Backend | Description | Use Case |
|---------|-------------|----------|
| `sled` | Embedded key-value store (default) | Production nodes |
| `redb` | Rust-native embedded database | Alternative production backend |
| `memory` | In-memory (volatile) | Testing and development |

### State Root Computation

After each block, the state root is computed using a sorted Merkle tree:

1. Collect all `(address, account_data)` pairs
2. Sort by address (deterministic ordering)
3. Hash each pair: `keccak256(address || rlp(account))`
4. Build a binary Merkle tree from the leaf hashes
5. The root hash becomes the block's `state_root`

## Network Protocol

Mersennet nodes communicate using a custom peer-to-peer protocol built on TCP and UDP.

### Message Types

Nodes exchange three categories of messages:

| Message | Transport | Purpose |
|---------|-----------|---------|
| `Tx` | UDP gossip | Propagate new transactions (wallet txs carry their raw signed envelope so peers re-verify the true EIP-155 signature) |
| `Block` | UDP gossip + TCP sync | Broadcast produced blocks; TCP backfills gaps for catching-up nodes |
| `Vote` | UDP gossip | Signed finality votes over `(height, block_hash)` |

### Peer Discovery

Nodes discover peers through:

1. **Seed nodes**: Configured in `p2p.peers` (bootstrap addresses)
2. **Peer exchange**: Connected nodes share their known peer lists
3. **Persistent peer store**: Known peers are saved to `peers.json` for reconnection on restart

### Block Propagation

```
   Leader Node                    Validator Node A              Validator Node B
       │                                │                              │
       │  1. Produce block              │                              │
       │  2. Gossip block ──────────────┤──────────────────────────────┤
       │                                │                              │
       │                                │  3. Re-execute & verify      │  Re-execute & verify
       │                                │                              │
       │  4. Signed votes  ◄────────────┤◄─────────────────────────────┤
       │     gossip everywhere          │  (every node counts stake)   │
       │                                │                              │
       │  5. ≥2/3 stake → FINAL         │  ≥2/3 stake → FINAL          │  ≥2/3 stake → FINAL
       ▼                                ▼                              ▼
```

### Transport Layers

| Layer | Protocol | Purpose |
|-------|----------|---------|
| **TCP Sync** | TCP | Reliable block and state synchronization |
| **UDP Gossip** | UDP | Low-latency transaction and vote propagation |
| **Noise Protocol** | Optional | Encrypted P2P communication (enable with `noise_enabled: true`) |

### Gossip Configuration

Transaction and vote gossip uses configurable parameters:

- Messages are forwarded to all connected peers
- Duplicate message detection prevents re-broadcasting
- Connection health is monitored with periodic pings

## Configuration Reference

Complete reference of all configuration parameters with their default values.

### `engine`: Core Engine Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `chain_id` | `u64` | `131071` | Chain identifier (must match genesis) |
| `state_path` | `string` | `"state"` | Directory for state storage |
| `gas_limit_per_block` | `u64` | `30000000` | Maximum gas per block (30M) |
| `fee_elasticity_multiplier` | `u64` | `2` | EIP-1559 elasticity multiplier |
| `fee_max_change_denominator` | `u64` | `8` | Max base fee change per block (12.5%) |
| `storage_backend` | `string` | `"sled"` | Storage backend: `"sled"`, `"redb"`, or `"memory"` |

### `mempool`: Transaction Pool

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_total` | `usize` | `10000` | Maximum transactions in the mempool |
| `max_per_sender` | `usize` | `1000` | Maximum pending txs per sender address |
| `bump_bps` | `u64` | `1000` | Minimum gas price bump for tx replacement (10%) |

### `p2p`: Peer-to-Peer Networking

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `node_key_path` | `string` | `"state/node_key.json"` | Path to the node identity key |
| `peer_store_path` | `string` | `"state/peers.json"` | Path to persistent peer list |
| `listen` | `string` | `"0.0.0.0:30303"` | P2P listen address |
| `peers` | `string[]` | `[]` | Seed peer addresses for bootstrap |
| `block_time_ms` | `u64` | `1000` | Target block production interval in ms (the public testnet runs `2000`) |
| `noise_enabled` | `bool` | `false` | Enable Noise protocol encryption |

### `rpc`: JSON-RPC Server

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | `bool` | `false` | Enable the HTTP JSON-RPC server |
| `addr` | `string` | `"127.0.0.1:8545"` | RPC listen address and port |

### `ws`: WebSocket Server

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | `bool` | `false` | Enable the WebSocket server |
| `addr` | `string` | `"127.0.0.1:9945"` | WebSocket listen address and port |

### `slashing`: Slashing Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `double_sign_bps` | `u64` | `500` | Base penalty for double-signing (5%) |
| `timeout_bps` | `u64` | `100` | Base penalty for timeout (1%) |
| `escalation_step_bps` | `u64` | `25` | Penalty increase per repeated offense (0.25%) |
| `escalation_max_bps` | `u64` | `1000` | Maximum escalated penalty (10%) |
| `round_timeout_ms` | `u64` | `500` | Consensus round timeout in milliseconds |
| `unbonding_period` | `u64` | `2` | Blocks before unbonded stake is withdrawable (code default; the public testnet configs use 100) |

### `token_economics`: Reward & Supply

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_supply` | `string` | `"618970019642690137449562111"` | Supply cap, 2⁸⁹ − 1 wei ≈ 618.97M MRSN (Mersenne prime; hard ceiling) |
| `initial_reward_per_block` | `string` | `"2305843009213693951"` | Block reward, 2⁶¹ − 1 wei ≈ 2.3 MRSN (Mersenne prime) |
| `halving_interval` | `u64` | `33550336` | Blocks between reward halvings (5th perfect number, 2¹² × (2¹³ − 1)) |

### `mersennet_orders`: MersennetOrders Precompile

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `initial_margin_bps` | `u64` | `0` | Initial margin requirement (basis points) |
| `maintenance_margin_bps` | `u64` | `0` | Maintenance margin requirement (basis points) |

### `bridge`: Cross-Domain Bridge

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_queue_len` | `usize` | `10000` | Maximum pending bridge messages |

### `zk`: Zero-Knowledge Proofs

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | `bool` | `false` | Enable ZK proof generation |
| `checkpoint_interval` | `u64` | `100` | Blocks between ZK checkpoints |

### Example Full Configuration

```json
{
  "engine": {
    "chain_id": 131071,
    "state_path": "state",
    "gas_limit_per_block": 30000000,
    "fee_elasticity_multiplier": 2,
    "fee_max_change_denominator": 8,
    "storage_backend": "sled"
  },
  "mempool": {
    "max_total": 10000,
    "max_per_sender": 1000,
    "bump_bps": 1000
  },
  "p2p": {
    "node_key_path": "state/node_key.json",
    "peer_store_path": "state/peers.json",
    "listen": "0.0.0.0:30303",
    "peers": [
      "46.225.30.187:30303"
    ],
    "block_time_ms": 2000,
    "noise_enabled": false
  },
  "rpc": {
    "enabled": true,
    "addr": "0.0.0.0:8545"
  },
  "ws": {
    "enabled": true,
    "addr": "0.0.0.0:9945"
  },
  "slashing": {
    "double_sign_bps": 500,
    "timeout_bps": 100,
    "escalation_step_bps": 25,
    "escalation_max_bps": 1000,
    "round_timeout_ms": 500,
    "unbonding_period": 2
  },
  "token_economics": {
    "max_supply": "618970019642690137449562111",
    "initial_reward_per_block": "2305843009213693951",
    "halving_interval": 33550336
  },
  "mersennet_orders": {
    "initial_margin_bps": 0,
    "maintenance_margin_bps": 0
  },
  "bridge": {
    "max_queue_len": 10000
  },
  "zk": {
    "enabled": false,
    "checkpoint_interval": 100
  }
}
```

## Summary

Mersennet's PoS consensus provides:

- **Fast finality** (~2s blocks, one vote round to quorum)
- **Fair leader rotation** (deterministic round-robin with timeout failover)
- **BFT security** (≥ 2/3 of stake must sign every finalized block)
- **Economic security** (escalating slashing for misbehavior)
- **No reversals** (finalized blocks are final; every block hash-links to its parent)
