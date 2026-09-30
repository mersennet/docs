---
title: "Monitoring & Alerts"
description: "Monitor a Mersennet validator: built-in Telegram alerts, mersennet-check, Prometheus metrics and Grafana dashboards."
---

Running a validator requires 24/7 visibility into node health, consensus participation, and resource usage. Start with the network's built-in Telegram alerts (nothing to install), then add Prometheus and Grafana if you want dashboards and your own alert rules.

## Telegram alerts (built in)

The network watches every registered validator and the nodes it can reach, and can message you on Telegram about yours. No software on your server: link your operator wallet once.

1. Open the [staking page](https://trade.mersennet.com/staking) with the operator wallet connected. In the **Your node** card, click **Enable Telegram alerts**.
2. Sign the message (a signature, not a transaction — nothing is sent on chain), then follow the `t.me/…?start=` link and press **Start** in the bot.
3. The bot confirms the link and answers `/status` at any time with your validator's state, build and height. **Disable** in the same card unlinks it.

You are told when your validator:

| Event | When |
|---|---|
| Changes status | pending → active, active → standby, jailed, exiting… with the reason |
| Is benched | missed 3 leader slots this epoch — out of the rotation until the epoch boundary |
| Is missing slots | 2+ missed leader slots and nothing proposed this epoch |
| Is jailed | until which epoch, and the escalation count |
| Falls behind | node height more than 300 blocks behind the chain (and again when it catches up) |
| Goes silent | the network's probe has not reached the node for 45 minutes |
| Runs an old build | your build differs from the current release, with the upgrade command |
| Faces a protocol upgrade | reminders ahead of each announced height |

Traders can link the same bot from the account panel on the [trade page](https://trade.mersennet.com/trade) for liquidation warnings (equity within 1.6× of maintenance margin, and when an account becomes liquidatable) once the settlement upgrade is live.

## Overview

Beyond the built-in alerts above, the [status page](https://status.mersennet.com/status/mersennet) shows the public infrastructure and `mersennet-check` gives a one-screen local check. For dashboards and your own alert rules, the usual stack is:

| Component | Purpose |
|-----------|---------|
| **Prometheus** | Scrapes metrics from the Mersennet node |
| **Grafana** | Dashboards and visualization |
| **Alertmanager** | Routes alerts (email, Slack, PagerDuty) |

## Key Metrics

Mersennet exposes metrics that you should monitor:

| Metric | Description |
|--------|-------------|
| `mersennet_height` | Latest committed block height; should increase steadily |
| `mersennet_total_stake` | Total staked MRSN across all validators |
| `mersennet_block_tx_count` | Transaction count in the latest block |
| `mersennet_mempool_size` | Mempool size; high values may indicate congestion |
| `mersennet_validators_active` | Number of active validators |
| `mersennet_slashing_events` | Slashing evidence events by kind (slashing risk) |

:::tip
The full metric list is exposed at the node's `/metrics` endpoint (served on the RPC port). See [Run a Node: Monitoring Setup](/validators/run-a-node/#monitoring-setup) for the complete table.
:::

## Prometheus Setup

### 1. Install Prometheus

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install prometheus

# Or download the current release from https://prometheus.io/download/ and unpack it
tar xvfz prometheus-*.tar.gz
cd prometheus-*
```

### 2. Configure Scraping

Edit `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'mersennet'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['localhost:8545']  # Mersennet RPC port (serves /metrics)
```

Mersennet serves Prometheus metrics at `GET /metrics` on the JSON-RPC port (`rpc.addr`, default 8545). The installed service already starts RPC on `127.0.0.1:8545` (`--rpc` in the unit), so `/metrics` is available locally out of the box; only manual runs need `rpc.enabled: true` or `--rpc`.

### 3. Start Prometheus

```bash
./prometheus --config.file=prometheus.yml
```

## Grafana Setup

### 1. Install Grafana

```bash
# Ubuntu/Debian
sudo apt install -y apt-transport-https software-properties-common wget
sudo mkdir -p /etc/apt/keyrings
wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
sudo apt update
sudo apt install grafana
sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

### 2. Add Prometheus Data Source

1. Open Grafana at `http://localhost:3000`
2. Login (default: admin/admin)
3. **Configuration** → **Data Sources** → **Add data source**
4. Select **Prometheus**
5. URL: `http://localhost:9090`
6. **Save & Test**

### 3. Import or Create Dashboards

Create panels for:

- **Block height**: Graph of `mersennet_height` over time
- **Total stake**: Gauge or stat for `mersennet_total_stake`
- **Blocks this node proposed**: rate of `mersennet_blocks_produced_total` (stays at 0 on a full node or a validator outside the active set — track `mersennet_height` for liveness)
- **Pending transactions**: `mersennet_mempool_size`
- **Active validators**: `mersennet_validators_active`
- **Slashing events**: `mersennet_slashing_events` (critical for validators)

## Alert Rules

Configure Prometheus alerting to catch issues before they cost you leader slots (benching, jailing) or — for equivocation only — stake.

### Prometheus Alert Rules

Create `alerts.yml` (or add to `prometheus.yml`):

```yaml
groups:
  - name: mersennet
    rules:
      # Block production stalled
      - alert: MersennetBlockStalled
        expr: increase(mersennet_height[5m]) == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Mersennet block production stalled"
          description: "No new blocks in 5 minutes. Node may be out of sync or consensus may be stuck."

      # Slashing events (slashing risk)
      - alert: MersennetSlashingEvents
        expr: increase(mersennet_slashing_events[1h]) > 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Validator slashing evidence recorded"
          description: "Slashing evidence (double-sign) recorded in the last hour."

      # Low disk space (needs node_exporter on the host for the node_* metrics)
      - alert: MersennetLowDiskSpace
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space on Mersennet node"
          description: "Less than 10% disk space remaining. Node may stop if disk fills."

      # Mempool approaching capacity
      - alert: MersennetHighMempool
        expr: mersennet_mempool_size > 8000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Mempool approaching capacity"
          description: "Mempool above 8000 of the default 10000 limit. Network may be congested."
```

Reference the rules file in `prometheus.yml`:

```yaml
rule_files:
  - 'alerts.yml'
```

### Alertmanager (Optional)

To send alerts to email, Slack, or PagerDuty:

1. Install [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/)
2. Configure receivers (e.g. Slack webhook)
3. Set `alertmanager.url` in Prometheus config

## Best Practices

| Practice | Recommendation |
|----------|----------------|
| **Uptime** | Aim for 99.9%+: three missed leader slots bench you for the rest of the epoch; missing more than 20% of your slots jails you for the next one (1, 2, 4, 8, 16, 24 epochs for consecutive jails). No stake penalty, but no rewards either |
| **Disk** | Monitor and expand before hitting 10% free |
| **Peers** | At least one peer (`mersennet-check` → Peers) — the whole network is a dozen or so reachable nodes; keep UDP and TCP 30303 open inbound to be reachable yourself |
| **Backups** | Backup validator key and config; never expose the key |
| **Alerts** | Route critical alerts to a channel you monitor 24/7 |

## Next Steps

- [Validator Overview](/validators/overview/): Understand validator roles and risks
- [Staking Guide](/validators/staking/): Manage stake and delegations
