---
title: "Run a Node"
---

This guide walks you through building, configuring, and running a Mersennet node from source — first as a **full node** (syncs the chain, serves RPC, relays transactions), then what it takes to run a **validator**.

Anyone can run a full node against the public testnet today. The node ships with a canonical testnet configuration, syncs historical blocks from the bootnodes at several hundred blocks per second, and then follows live gossip.

## Prerequisites

### Hardware Requirements

| Resource | Minimum | Recommended | Notes |
|----------|---------|-------------|-------|
| **CPU** | 2 cores | 4+ cores | EVM execution and initial sync are CPU-bound (the testnet validators run 2 vCPU) |
| **RAM** | 4 GB | 8 GB | State and mempool reside in memory |
| **Storage** | 40 GB SSD | 200 GB NVMe SSD | State grows over time; NVMe recommended for I/O |
| **Network** | 100 Mbps | 1 Gbps | Low latency matters for consensus round-trips |
| **OS** | Ubuntu 22.04+ | Ubuntu 24.04 LTS | Any modern Linux; macOS for development only |

:::caution
Running on HDD (spinning disk) is not recommended. The sled storage backend performs frequent random reads/writes that require SSD-class IOPS.
:::

### Software Requirements

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Rust** | 1.85 or later | Compiler for building from source (the workspace uses Rust edition 2024) |
| **Git** | Latest | Clone the repository |
| **build-essential** | Latest | C linker and system libraries |
| **pkg-config** | Latest | Library discovery for native dependencies |
| **libssl-dev** | Latest | TLS support for networking |

Install all dependencies on Ubuntu/Debian:

```bash
sudo apt update && sudo apt install -y build-essential pkg-config libssl-dev git
```

Install Rust via [rustup](https://rustup.rs/):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustc --version  # Should be 1.85+
```

## Build from Source

Clone the Mersennet repository and build the release binary:

:::note[Repository access]
The `mersennet/mersennet` repository is private during the current testnet phase. If the clone below fails with "Repository not found", request access from the team via [GitHub](https://github.com/mersennet) or the community channels listed in the [FAQ](/resources/faq/); source access is granted to prospective validators.
:::

```bash
git clone https://github.com/mersennet/mersennet.git
cd mersennet
cargo build --release
```

The binary will be at `target/release/mersennet` (built from the `mersennet-node` crate).

## Join the Testnet (Full Node)

### The canonical config

Every node on the network must share the exact same `genesis`, `engine.chain_id`, and `token_economics` configuration — the genesis state is derived deterministically from it. The canonical testnet configuration ships in the repository:

```
networks/testnet/config.json
```

:::danger[Do not hand-write the genesis section]
A node started with a different `genesis` section computes a different genesis state and will reject (or diverge from) every block it receives. Always start from `networks/testnet/config.json` and only adjust the runtime sections: `rpc`, `ws`, `p2p.listen`, and file paths.
:::

### Quick start (foreground)

```bash
mkdir -p ~/mersennet-node && cd ~/mersennet-node
cp <repo>/networks/testnet/config.json .
<repo>/target/release/mersennet --config config.json --mode full --rpc
```

On first start the node:

1. Generates a P2P identity at `keys/node_key.json` (keep this file to retain your peer identity).
2. Builds the genesis state from the config and logs `registered genesis validator ...` and `seeded genesis market ...` lines.
3. Pulls historical blocks from the bootnodes in 256-block batches over TCP 30303 (`synced blocks from peer ...` log lines) at several hundred blocks per second.
4. Switches to following live gossip once caught up (`received block from network ...` followed by `block finalized by 2/3 stake quorum ...`).

Check sync progress against the [explorer](https://explorer.mersennet.com):

```bash
curl -s http://127.0.0.1:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

:::note[NAT and firewalls]
Outbound-only connectivity is enough to sync and follow the chain — block sync and gossip both work from behind NAT. Opening UDP+TCP 30303 to the world additionally lets other peers discover and sync from your node, which strengthens the network.
:::

### One-command install (systemd)

For a production deployment, the repository ships an installer that sets up the binary, config, dedicated user, and a hardened systemd service (see [Systemd Service](#systemd-service-production) below for what it installs):

```bash
cargo build --release --bin mersennet
sudo bash networks/testnet/install.sh
```

### Bootnodes

The canonical config already lists these seed peers (UDP 30303 gossip, TCP 30303 block sync):

| Bootnode | Address |
|----------|---------|
| Public RPC node | `46.225.30.187:30303` |
| Validator 1 | `46.225.183.192:30303` |
| Validator 2 | `49.13.54.79:30303` |

## Configuration

Mersennet uses a JSON configuration file. The canonical testnet file covers everything below; this reference explains each section.

### Runtime sections you may adjust

```json
{
  "engine": {
    "state_path": "data/state"
  },
  "p2p": {
    "node_key_path": "keys/node_key.json",
    "peer_store_path": "data/peers.json",
    "listen": "0.0.0.0:30303",
    "peers": ["46.225.30.187:30303", "46.225.183.192:30303", "49.13.54.79:30303"],
    "block_time_ms": 2000
  },
  "rpc": {
    "enabled": false,
    "addr": "127.0.0.1:8545"
  },
  "ws": {
    "enabled": false,
    "addr": "127.0.0.1:8546"
  }
}
```

Relative paths resolve against the node's working directory. The RPC defaults to loopback — bind `0.0.0.0` only if you intend to serve the endpoint publicly (put a TLS-terminating reverse proxy such as Caddy or nginx in front).

### Full Configuration Reference

#### `engine`: Core Engine

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `chain_id` | `u64` | `131071` | Chain identifier, must match genesis and network |
| `state_path` | `string` | `"state"` | Directory for state database and metadata |
| `gas_limit_per_block` | `u64` | `30000000` | Maximum gas per block (30M) |
| `fee_elasticity_multiplier` | `u64` | `2` | EIP-1559 elasticity (target = limit / multiplier) |
| `fee_max_change_denominator` | `u64` | `8` | Max base fee change per block (1/8 = 12.5%) |
| `storage_backend` | `string` | `"sled"` | `"sled"`, `"redb"`, or `"memory"` |

#### `mempool`: Transaction Pool

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_total` | `usize` | `10000` | Maximum transactions in the mempool |
| `max_per_sender` | `usize` | `1000` | Max pending txs per sender address |
| `bump_bps` | `u64` | `1000` | Min gas price bump for replacement (10%) |

#### `p2p`: Peer-to-Peer Networking

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `node_key_path` | `string` | `"state/node_key.json"` | Path to node identity keypair |
| `peer_store_path` | `string` | `"state/peers.json"` | Path to persistent peer list |
| `listen` | `string` | `"0.0.0.0:30303"` | P2P listen address |
| `peers` | `string[]` | `[]` | Seed peers for bootstrap |
| `block_time_ms` | `u64` | `1000` | Block production interval (ms). Code default is 1000; the public testnet runs 2000 (~2s blocks) — match the network you join |
| `noise_enabled` | `bool` | `false` | Encrypt P2P with Noise Protocol |

#### `rpc`: JSON-RPC Server

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | `bool` | `false` | Enable the HTTP JSON-RPC server |
| `addr` | `string` | `"127.0.0.1:8545"` | RPC listen address |

#### `ws`: WebSocket Server

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | `bool` | `false` | Enable the WebSocket server |
| `addr` | `string` | `"127.0.0.1:9945"` | WebSocket listen address |

#### `slashing`: Slashing Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `double_sign_bps` | `u64` | `500` | Double-sign penalty (5%) |
| `timeout_bps` | `u64` | `100` | Timeout penalty (1%) |
| `escalation_step_bps` | `u64` | `25` | Penalty increase per offense (0.25%) |
| `escalation_max_bps` | `u64` | `1000` | Maximum penalty cap (10%) |
| `round_timeout_ms` | `u64` | `500` | Consensus round timeout (ms) |
| `unbonding_period` | `u64` | `2` | Blocks before unbonded stake is withdrawable (code default; the public testnet configs use 100) |

#### `token_economics`: Rewards & Supply

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_supply` | `string` | `"618970019642690137449562111"` | Supply cap, 2⁸⁹ − 1 wei ≈ 618.97M MRSN (Mersenne prime; hard ceiling) |
| `initial_reward_per_block` | `string` | `"2305843009213693951"` | Block reward, 2⁶¹ − 1 wei ≈ 2.3 MRSN (Mersenne prime) |
| `halving_interval` | `u64` | `33550336` | Blocks between reward halvings (5th perfect number, 2¹² × (2¹³ − 1)) |

#### `mersennet_orders`: MersennetOrders Precompile

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `initial_margin_bps` | `u64` | `0` | Initial margin requirement (bps) |
| `maintenance_margin_bps` | `u64` | `0` | Maintenance margin (bps) |

#### `bridge`: Cross-Domain Bridge

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_queue_len` | `usize` | `10000` | Max pending bridge messages |

#### `zk`: Zero-Knowledge Proofs

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | `bool` | `false` | Enable ZK proof generation |
| `checkpoint_interval` | `u64` | `100` | Blocks between ZK checkpoints |

:::tip
Check the [Network Information](/getting-started/network-info) page for current seed peer addresses.
:::

## Genesis Setup

Genesis is not a separate file: it is the `genesis` section of your `config.json`, defining initial accounts, validators, CLOB markets, and collateral assets. Every node derives the identical genesis state from it, which is why the section must be byte-for-byte compatible across the network.

- **Testnet (chain ID 131071)**: use `networks/testnet/config.json` from the repository — never edit its `genesis`, `engine.chain_id`, or `token_economics` sections.
- **Mainnet (chain ID 8191)**: see `mainnet/genesis.json` in the repository for the canonical parameters (not yet launched).

## Node Modes

The `--mode` flag accepts `full`, `validator`, or `devnet`:

| Mode | Behavior |
|------|----------|
| `full` | Syncs, follows consensus, serves RPC/WS, relays transactions. Does not propose blocks. **Use this for the public testnet.** |
| `validator` | Everything `full` does, plus block production when this node's key is in the active validator set and elected leader. |
| `devnet` | Local single-node demo chain. This is the default when `--mode` is omitted — always pass `--mode` explicitly for real deployments. |

```bash
# Full node (RPC enabled)
./target/release/mersennet --config config.json --mode full --rpc

# Validator
./target/release/mersennet --config config.json --mode validator
```

## Becoming a Validator

The active validator set currently consists of the four genesis validators. **Runtime validator registration is not yet open**: staking your own node into the active set requires a chain upgrade that is on the roadmap (the precompile selectors are reserved). What you can do today:

1. **Run a full node** — identical software, real contribution to network resilience, and the operational dry-run for validating later.
2. **Delegate MRSN to an existing validator** via the staking precompile and earn a share of block rewards. See the [Staking Guide](/validators/staking) and the [explorer's Validators page](https://explorer.mersennet.com/validators).
3. **Register interest in validating** through the community channels in the [FAQ](/resources/faq/) — prospective validators for the next validator-set expansion are onboarded from there.

When validator onboarding opens, the flow will be: sync a full node, stake MRSN from the address matching your `p2p.node_key_path` identity, and the node begins participating in consensus once the set change takes effect. The node logs its validator address at startup (`validator_addr=0x...`).

## Systemd Service (Production)

For production deployments, run the node as a systemd service with proper resource limits and security hardening. This is exactly what `sudo bash networks/testnet/install.sh` sets up; the steps below are the manual equivalent.

### Create a Dedicated User

```bash
sudo useradd --system --home-dir /var/lib/mersennet --shell /usr/sbin/nologin mersennet
sudo mkdir -p /var/lib/mersennet/{data,keys}
sudo chown -R mersennet:mersennet /var/lib/mersennet
```

### Service File

Create `/etc/systemd/system/mersennet.service`:

```ini
[Unit]
Description=Mersennet Full Node (testnet, chain 131071)
Documentation=https://docs.mersennet.com
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=mersennet
Group=mersennet
WorkingDirectory=/var/lib/mersennet

ExecStart=/usr/local/bin/mersennet \
    --config /etc/mersennet/config.json \
    --mode full \
    --rpc

Restart=always
RestartSec=10
StartLimitInterval=200
StartLimitBurst=5

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mersennet

# Security hardening
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/mersennet
PrivateTmp=yes

# Resource limits
LimitNOFILE=65535
LimitNPROC=4096
MemoryMax=12G

# Environment
Environment="RUST_LOG=info"
Environment="RUST_BACKTRACE=1"

[Install]
WantedBy=multi-user.target
```

### Install and Start

```bash
# Copy binary
sudo cp target/release/mersennet /usr/local/bin/
sudo chmod +x /usr/local/bin/mersennet

# Copy config
sudo mkdir -p /etc/mersennet
sudo cp config.json /etc/mersennet/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable mersennet
sudo systemctl start mersennet

# Check status
sudo systemctl status mersennet
sudo journalctl -u mersennet -f
```

### Log Levels

Control verbosity via the `RUST_LOG` environment variable:

```bash
# Default — info level
Environment="RUST_LOG=info"

# Debug networking issues
Environment="RUST_LOG=info,mersennet_network=debug"

# Trace EVM execution (very verbose)
Environment="RUST_LOG=info,mersennet::engine=trace"

# Quiet mode — warnings and errors only
Environment="RUST_LOG=warn"
```

## Log Interpretation Guide

Understanding node log messages helps diagnose issues quickly.

### Normal Operation

| Log Message | Meaning |
|------------|---------|
| `node identity loaded address=0x...` | Node keypair loaded successfully |
| `registered genesis validator address=0x...` | Validator registered from genesis config |
| `RPC server listening on 0.0.0.0:8545` | JSON-RPC server started |
| `P2P listening on 0.0.0.0:30303` | Peer-to-peer networking active |
| `block produced number=N txs=M gas_used=G` | Block successfully produced |
| `block finalized number=N hash=0x...` | Block reached 2/3+ consensus |
| `peer connected addr=1.2.3.4:30303` | New peer connection established |

### Warning Signs

| Log Message | Meaning | Action |
|------------|---------|--------|
| `consensus timeout round=N` | Failed to get 2/3+ votes in time | Check peer connectivity |
| `mempool full, rejecting tx` | Mempool at capacity (10K default) | Increase `mempool.max_total` or reduce load |
| `peer disconnected addr=...` | Lost connection to a peer | Check network; peer may restart automatically |
| `slashing evidence kind=timeout` | This node missed a consensus round | Ensure clock sync and network stability |

### Error Messages

| Log Message | Meaning | Action |
|------------|---------|--------|
| `failed to read config file` | Config path invalid or unreadable | Verify `--config` path and file permissions |
| `invalid address hex` | Malformed address in genesis config | Fix the hex address in config.json |
| `signing failed` | Node key corrupted or missing | Restore from backup or regenerate identity |
| `state lock poisoned` | Internal state corruption (panic recovery) | Restart the node; report if persistent |

## Monitoring Setup

Mersennet exposes Prometheus-compatible metrics at the `/metrics` endpoint on the RPC port.

### Available Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `mersennet_up` | Gauge | Node liveness (always 1 while running) |
| `mersennet_height` | Gauge | Latest committed block height |
| `mersennet_blocks_produced_total` | Counter | Total blocks produced |
| `mersennet_block_gas_used` | Gauge | Gas consumed in latest block |
| `mersennet_block_tx_count` | Gauge | Transaction count in latest block |
| `mersennet_block_execution_seconds` | Histogram | Block execution duration |
| `mersennet_base_fee_wei` | Gauge | Current EIP-1559 base fee |
| `mersennet_consensus_rounds` | Counter | Total consensus rounds |
| `mersennet_consensus_finalized` | Counter | Total blocks finalized |
| `mersennet_validators_active` | Gauge | Active validator count |
| `mersennet_total_stake` | Gauge | Total staked MRSN |
| `mersennet_slashing_events` | Counter | Slashing events by kind |
| `mersennet_mempool_size` | Gauge | Current mempool transaction count |
| `mersennet_mempool_rejected` | Counter | Rejected transactions by reason |
| `mersennet_rpc_requests` | Counter | RPC requests by method |
| `mersennet_rpc_errors` | Counter | RPC errors by method and code |
| `mersennet_rpc_duration_seconds` | Histogram | RPC request duration |
| `mersennet_orders_submitted` | Counter | Orders submitted to order book |
| `mersennet_orders_filled` | Counter | Orders fully filled |
| `mersennet_trades_executed` | Counter | Trade fills executed |
| `mersennet_markets_active` | Gauge | Active markets count |

### Prometheus Configuration

Add the following scrape target to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'mersennet'
    scrape_interval: 15s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['localhost:8545']
        labels:
          chain: 'mersennet-testnet'
          node: 'validator-01'
```

### Grafana Dashboard

Connect Grafana to your Prometheus instance and create dashboards for:

- **Block Production**: Height over time, block execution duration, gas usage trends
- **Consensus Health**: Finalization rate, consensus rounds, active validators
- **Mempool**: Pool size, rejection rate, gas price distribution
- **Network**: Peer count, P2P message rates
- **MersennetOrders**: Order submission rate, fill rate, active markets

Network health is also observable without running your own stack: the [explorer's Network page](https://explorer.mersennet.com/network) shows live validator status, block cadence, and peer counts.

### Alerting Rules

Recommended Prometheus alert rules:

```yaml
groups:
  - name: mersennet
    rules:
      - alert: NodeDown
        expr: up{job="mersennet"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Mersennet node is down"

      - alert: BlockProductionStalled
        expr: increase(mersennet_blocks_produced_total[5m]) == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "No blocks produced in 5 minutes"

      - alert: HighMempoolSize
        expr: mersennet_mempool_size > 8000
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Mempool approaching capacity"

      - alert: SlashingEvent
        expr: increase(mersennet_slashing_events[5m]) > 0
        labels:
          severity: critical
        annotations:
          summary: "Validator slashing event detected"

      - alert: ConsensusTimeouts
        expr: increase(mersennet_consensus_rounds[5m]) - increase(mersennet_consensus_finalized[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High number of consensus timeouts"
```

## Backup and Restore

### What to Back Up

Paths below follow the canonical config (relative to the node's working directory, `/var/lib/mersennet` under systemd):

| Path | Contents | Critical? |
|------|----------|-----------|
| `keys/node_key.json` | Node identity keypair (validator signing key) | **Yes**, loss means new identity |
| `data/peers.json` | Known peer addresses | No, peers rediscovered on restart |
| `data/state/` | Full chain state (accounts, storage, blocks) | Yes, loss requires resync (fast: several hundred blocks/s) |
| `config.json` | Node configuration | Yes, keep in version control |

### Backup Procedure

```bash
# Stop the node first to ensure consistent state
sudo systemctl stop mersennet

# Create timestamped backup
BACKUP_DIR="/backups/mersennet/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /var/lib/mersennet/keys /var/lib/mersennet/data "$BACKUP_DIR/"
cp /etc/mersennet/config.json "$BACKUP_DIR/"

# Restart the node
sudo systemctl start mersennet
```

### Restore Procedure

```bash
# Stop the node
sudo systemctl stop mersennet

# Restore from backup
BACKUP_DIR="/backups/mersennet/20260101-120000"
rm -rf /var/lib/mersennet/data /var/lib/mersennet/keys
cp -r "$BACKUP_DIR/data" "$BACKUP_DIR/keys" /var/lib/mersennet/
chown -R mersennet:mersennet /var/lib/mersennet

# Start the node — it will catch up from the restored height
sudo systemctl start mersennet
```

:::caution
Never run two nodes with the same `node_key.json` simultaneously: this may trigger double-sign slashing.
:::

## Troubleshooting

### Common Issues

#### Node won't start

| Symptom | Cause | Solution |
|---------|-------|----------|
| `failed to read config file` | Config path wrong or missing | Check `--config` path; ensure file exists and is valid JSON |
| `address already in use` | Port conflict (8545, 8546, or 30303) | Stop conflicting process or change port in config |
| `permission denied` | File/directory permissions | `chown -R mersennet:mersennet /var/lib/mersennet` |
| `failed to install Prometheus metrics exporter` | Duplicate recorder initialization | Ensure only one node instance is running |

#### Node not producing blocks

| Symptom | Cause | Solution |
|---------|-------|----------|
| No `block produced` logs | Not registered as validator | Stake MRSN and verify your node key matches |
| Only importing blocks | Node is syncing | Wait for sync to complete to chain tip |
| `consensus timeout` repeated | Network partition or clock drift | Check peers list; sync system clock with NTP |

#### Peer connection issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| 0 connected peers | Firewall blocking port 30303 | Open TCP/UDP 30303 in firewall |
| Peers connect then disconnect | Chain ID mismatch | Verify `engine.chain_id` matches network (131071) |
| Slow block propagation | High network latency | Use peers geographically closer; check bandwidth |

#### High resource usage

| Symptom | Cause | Solution |
|---------|-------|----------|
| Memory >12GB and growing | State trie growth | Normal for long-running nodes; increase RAM or add swap |
| CPU constantly at 100% | EVM execution or block production | Check for spam transactions; consider `gas_limit_per_block` adjustment |
| Disk filling up | State database growth | Increase storage; consider pruning old data |

### Useful Commands

```bash
# Check node status
sudo systemctl status mersennet

# Follow logs in real time
sudo journalctl -u mersennet -f

# Check block height via RPC
curl -s http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq

# Check connected peer count
curl -s http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' | jq

# Check node sync status
curl -s http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}' | jq

# View Prometheus metrics
curl -s http://localhost:8545/metrics | grep mersennet_height

# Check disk usage
du -sh /var/lib/mersennet/data/state/
```

## Next Steps

- [Staking Guide](/validators/staking): Stake MRSN and manage delegations
- [Monitoring & Alerts](/validators/monitoring): Set up Prometheus and Grafana
- [Node Architecture](/architecture/node-architecture): Understand the node internals
- [Consensus Mechanism](/architecture/consensus): Deep dive into the BFT proof-of-stake consensus
