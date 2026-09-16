---
title: "Run a Node"
description: "Install a Mersennet testnet full node in one command, check that it is syncing, and understand what it can and cannot do today."
---

Four steps, about 30 minutes, no source code required. You end up with a **full node**: it verifies every block, serves JSON-RPC locally and helps other peers sync.

:::tip[The short version]
On any Ubuntu 22.04+ / Debian 12+ server, with your wallet address in place of `0xYOUR_WALLET`:

```bash
curl -fsSL https://mersennet.com/downloads/install.sh | sudo bash -s -- --operator 0xYOUR_WALLET
```

Then `mersennet-check`: you want **in sync** and **visible**. That is the whole install — the node is verified automatically within about ten minutes and earns 500 points a day. Everything below is the same thing, step by step.
:::

:::note[What a node is — and is not — today]
A full node follows the chain and serves RPC; a **validator** additionally signs blocks. Since block 1,348,200 the set is open: any full node whose operator bonds 1,000 MRSN can register and join at the next epoch. See [Becoming a validator](#becoming-a-validator).
:::

## Step 1 — Get a server

| | Minimum | Recommended |
|---|---|---|
| OS | Ubuntu 22.04+ or Debian 12+ (x86-64) | Ubuntu 24.04 LTS |
| CPU / RAM | 2 cores / 4 GB | 4 cores / 8 GB |
| Disk | 40 GB SSD | 100 GB SSD (chain data grows ~0.5 GB/day) |
| Network | 10 Mbps, outbound UDP+TCP 30303 allowed | Inbound 30303 open too |

You need `sudo` (root) on the machine. That is the whole list — no Rust, no Git, no build tools.

:::tip[Using a separate disk or block volume]
Mount it first (e.g. at `/mnt/blockstorage`) and pass `--data-dir` in Step 2. The chain data and your node key go there; nothing else about the install changes.
:::

## Step 2 — Install (one command)

Run from **any directory** — it downloads the latest release, verifies its signature and checksum, installs the binary and config, creates a `mersennet` system user, restores the latest **state snapshot** (about 1 GB, SHA-256 verified) so the node only has to sync the last few hours instead of replaying the whole chain, and starts a hardened systemd service:

```bash
curl -fsSL https://mersennet.com/downloads/install.sh | sudo bash
```

Chain data on a mounted volume instead of the OS disk:

```bash
curl -fsSL https://mersennet.com/downloads/install.sh | sudo bash -s -- --data-dir /mnt/blockstorage/mersennet
```

Other option: `--rpc-public` listens for JSON-RPC on `0.0.0.0:8545` instead of localhost (only if you know you want that).

The installer ends with `Done. Your node is running as a systemd service.` If it prints an error instead, copy the last log lines it shows when you ask for help.

<details>
<summary>What the installer puts where</summary>

| Path | Contents |
|------|----------|
| `/usr/local/bin/mersennet` | Node binary — the same build the validators run (its sha256 is listed in the bundle README) |
| `/usr/local/bin/mersennet-check` | Health check command (Step 3) |
| `/etc/mersennet/config.json` | Canonical testnet config. Never edit `genesis`, `engine.chain_id` or `token_economics` |
| `/var/lib/mersennet` (or your `--data-dir`) | `data/` chain state and `keys/node_key.json` (your peer identity — back it up) |
| `/etc/systemd/system/mersennet.service` | The service (auto-restart, sandboxed) |

Everything it downloads is listed with checksums at [mersennet.com/downloads](https://mersennet.com/downloads/). To inspect before running, download the tarball from that page, extract it, and run `sudo bash install.sh` yourself — the one-liner does exactly that.
</details>

## Step 3 — Check that it is syncing

```bash
mersennet-check
```

```text
Service      running since 2026-09-12 15:02:25
Block height 21248 / 1281813 network — syncing (1% done, 512 blocks/s, ~41 min left)
Peers        18
Chain ID     131071 (Mersennet testnet)
Visibility   visible — the network hears this node as 203.0.113.10 · id 3f9a2c (explorer → Network → Network nodes)
Binary       87e1c0bb2c44 — up to date (release 806f3c6)
Data dir     /mnt/blockstorage/mersennet — 189M used, 281G free
Node key     /mnt/blockstorage/mersennet/keys/node_key.json (back this up to keep your peer identity)
```

- **syncing → catching up → in sync** is the normal sequence. A fresh install starts from a snapshot taken within the last six hours, so it is usually in sync within a minute or two; the line shows the measured rate and an ETA. Run `mersennet-check` again later.
- **Visibility: visible** means the public RPC node is receiving your gossip. Your node is then listed on the [explorer's Network page](https://explorer.mersennet.com/#/network) under *Network nodes* as a community node — by network prefix plus the id printed here, so you can recognise it without your full IP being published.
- **Peers 0** for more than a minute means outbound UDP+TCP 30303 is blocked on your host or provider firewall.
- **Binary: update available** means a new release is out — re-run the Step 2 command to upgrade in place.
- **Local RPC not answering** right after install is normal for a few seconds; if it persists, read the logs: `journalctl -u mersennet -n 50 --no-pager`.

When it says **in sync**, you are done. Your node is verifying the same blocks you see on the [explorer](https://explorer.mersennet.com) and can answer JSON-RPC on `http://127.0.0.1:8545`:

```bash
curl -s http://127.0.0.1:8545 -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

## Step 4 — Keep it running

| Task | Command |
|------|---------|
| Status | `mersennet-check` · `systemctl status mersennet` |
| Logs | `journalctl -u mersennet -f` |
| Restart | `sudo systemctl restart mersennet` |
| **Upgrade** to a new release | Re-run the Step 2 command — it replaces the binary, restarts the service, keeps data and keys |
| Back up your identity | Copy `keys/node_key.json` from your data dir somewhere safe |
| Let others sync from you | Open **UDP+TCP 30303** inbound (`sudo ufw allow 30303` — the installer does this if ufw is active) |
| Uninstall | `sudo systemctl disable --now mersennet && sudo rm -f /etc/systemd/system/mersennet.service /usr/local/bin/mersennet /usr/local/bin/mersennet-check && sudo rm -rf /etc/mersennet` — then delete the data dir if you want the chain data gone |

That is the complete guide for running a node. Everything below is background, the validator question, and reference material for operators who want to go deeper.

## Get recognised: verified node runner

Your node can earn **500 points a day** on [trade.mersennet.com/points](https://trade.mersennet.com/points) while it is online. The node proves it is yours: it signs an attestation with its node key that names your wallet as operator, and the terminal checks it against the node directly (port 30303).

1. Tell the node who operates it — either at install time:

   ```bash
   curl -fsSL https://mersennet.com/downloads/install.sh | sudo bash -s -- --operator 0xYOUR_WALLET
   ```

   or afterwards by adding `"operator_address": "0xyour_wallet"` to the `p2p` section of `/etc/mersennet/config.json` and running `sudo systemctl restart mersennet`.
2. Wait. Within about ten minutes of the network hearing your node, the terminal probes it, sees the operator address it signs, and marks it **verified** — on [trade.mersennet.com/points](https://trade.mersennet.com/points) (connect with that wallet) and on the explorer's Network page next to your node's id. Nothing to click.
3. Optional: on the Points page you can also enter your node's public IP and press **Sign & verify** for an immediate check, or if your node runs behind NAT and is not directly reachable.
4. The terminal re-checks the node every six hours; points are credited once per day while it answers. Several nodes under one wallet earn as one.

If verification fails, the message says why: port 30303/tcp not reachable from the internet, the node still on a build older than this feature (re-run the installer to upgrade), or the node naming a different operator.

## Becoming a validator

The set is open since block 1,348,200. With your node verified (above), open [trade.mersennet.com/staking](https://trade.mersennet.com/staking) with the operator wallet, choose a self-stake of at least **1,000 MRSN** and press **Bond & register** — you produce blocks from the next hourly epoch. Parameters, lifecycle (pending, active, standby, jailed, exiting), raw precompile calls and operating advice are on [Become a Validator](/validators/become-a-validator).

## Frequently asked

**My node is running but does not appear in the validator list.** A full node is not a validator until you register it. Verified nodes show on the explorer's *Network* page (with your operator badge); validators show on its *Validators* page after you register on [trade.mersennet.com/staking](https://trade.mersennet.com/staking) — see [Become a Validator](/validators/become-a-validator). `mersennet-check` saying *in sync* and *visible* is what success looks like today; the explorer's Network page lists it as a community node.

**`mersennet-check` says my node is forked, or the log shows "state root" differences.** Your node ran an older build through a consensus upgrade and its state diverged. Re-run the installer with `--reset-state` (add the same `--data-dir` / `--operator` flags you used before): it keeps your keys and identity, discards the chain state and restores the latest snapshot — back in sync in about a minute.

```bash
curl -fsSL https://mersennet.com/downloads/install.sh | sudo bash -s -- --reset-state --operator 0xYOUR_WALLET
```

**My node stopped advancing (the explorer moves, `mersennet-check` shows the same height).** Since build `0.7.0` of 16 Sep the node notices this itself: when its head has not moved for five minutes while the network is at least 60 blocks ahead, it exits and systemd restarts it (log line *"head has not advanced while the network moved on"*). On an older build, `sudo systemctl restart mersennet` does the same by hand. If it happens repeatedly, send us `journalctl -u mersennet -n 300 --no-pager` through the terminal's [feedback form](https://trade.mersennet.com/feedback) — that is exactly the kind of report the testnet is for.

**Do I have to upgrade when a new release comes out?** For a full node: whenever convenient — `mersennet-check` says *update available*. For a **validator: yes, before the next protocol switch height** (listed on [Network Info](/getting-started/network-info/#scheduled-protocol-switches) and announced on [Become a Validator](/validators/become-a-validator) and the [changelog](/resources/changelog); the staking page warns when your node is behind the current release). A validator on an old build applies the old rules from the switch height on, disagrees with the network about the next leader or the validator set, and forks off — it then needs `--reset-state`. Upgrading is the same one-line command as installing; it keeps your keys and data and takes under a minute.

**Do I need to do everything on this page?** No. Steps 1–4 are the whole thing. The sections below are reference material.

**Where do I run the commands? Does `cd ~` matter?** Anywhere. The one-line installer downloads into a temporary directory and cleans up; your current directory is irrelevant. Chain data always goes to `/var/lib/mersennet` unless you pass `--data-dir`.

**How do I keep the chain on my block storage instead of the OS disk?** `--data-dir /mnt/<your-volume>/mersennet` in Step 2. Re-running the installer with a new `--data-dir` moves an existing node's data there. Do not use `/tmp` paths — they are wiped on reboot and hidden from the service.

**Where does the 1,000,000 MRSN come from and how do I get it?** It is the genesis stake of the four founding validators, written into the genesis config before the chain started. You do not need it: the minimum self-stake for a new validator is 1,000 MRSN.

**How long does the first sync take?** About a minute: the installer restores the latest published state snapshot (taken every six hours on the public node, ~1 GB compressed, SHA-256 verified) and the node then replays only the blocks since. Replaying the whole chain from genesis (`--from-genesis`) takes most of a day at current transaction density and is only useful if you want to verify every block yourself. The node verifies every block it imports on top of the snapshot either way.

**Can I run it without systemd, or on another distro / architecture?** Yes — download the bundle from [mersennet.com/downloads](https://mersennet.com/downloads/), extract it and run `./mersennet --config config.json --mode full --rpc` from a directory of your choice (data lands in `./data`, key in `./keys`). Non-x86-64 or glibc < 2.34 systems need a source build (below).

---

## Advanced: manual install and source build

### Manual install from the bundle

Releases are signed. `SHA256SUMS.sig` is an ed25519 signature over `SHA256SUMS` by the Mersennet release key; the one-line installer pins this key and refuses to install if the signature does not verify. To check it yourself:

```bash
curl -fsSLO https://mersennet.com/downloads/SHA256SUMS
curl -fsSLO https://mersennet.com/downloads/SHA256SUMS.sig
printf -- '-----BEGIN PUBLIC KEY-----\n%s\n-----END PUBLIC KEY-----\n' \
  'MCowBQYDK2VwAyEAGhjx5fsplcdLhVLXX9JEQLeajDFpUEmiylFXO0VoLBc=' > mersennet-release.pub
openssl pkeyutl -verify -pubin -inkey mersennet-release.pub -rawin -in SHA256SUMS -sigfile SHA256SUMS.sig
#   -> Signature Verified Successfully
curl -fsSLO "https://mersennet.com/downloads/$(awk 'NR==1{print $2}' SHA256SUMS)"
sha256sum -c SHA256SUMS --ignore-missing          # must print: ... OK
tar xzf mersennet-node-linux-x86_64-*.tar.gz && cd mersennet-node-linux-x86_64-*/
sha256sum -c SHA256SUMS                            # verifies every file in the bundle
sudo bash install.sh [--data-dir DIR] [--rpc-public] [--from-genesis] [--operator 0xWALLET]
```

The bundle's `install.sh` performs the same snapshot bootstrap as the one-liner. The snapshot manifest is `http://46.225.30.187:8088/latest.json` (served from the public node over plain HTTP because Cloudflare limits proxied downloads to 100 MB; the tarball's SHA-256 is in the manifest and is checked before extraction).

The bundle README lists the binary's sha256; it matches `sha256sum /opt/mersennet/bin/mersennet` on the validators, so you can confirm you run the same build as the network.

### Build from source

:::note[Repository access]
The `mersennet/mersennet` repository is private during the current testnet phase. You do not need it to run a node — use the release bundle. If you want the source, request access via [GitHub](https://github.com/mersennet) or the community channels in the [FAQ](/resources/faq/).
:::

Requires Rust 1.85+ (edition 2024), `build-essential`, `pkg-config`, `libssl-dev`, Git:

```bash
sudo apt update && sudo apt install -y build-essential pkg-config libssl-dev git
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh && source $HOME/.cargo/env
git clone https://github.com/mersennet/mersennet.git && cd mersennet
cargo build --release --bin mersennet
sudo bash networks/testnet/install.sh              # same installer, repo layout
```

The canonical config, unit file, installer and `mersennet-check` live under `networks/testnet/`; `networks/testnet/package-release.sh` builds the public bundle.

### Bootnodes

The canonical config already lists these seed peers (UDP 30303 gossip, TCP 30303 block sync):

| Bootnode | Address |
|----------|---------|
| Public RPC node | `46.225.30.187:30303` |
| Validator 1 | `46.225.183.192:30303` |
| Validator 2 | `49.13.54.79:30303` |

Outbound-only connectivity is enough to sync and follow the chain. Opening 30303 inbound additionally lets other peers discover and sync from your node.

:::danger[Do not hand-write the genesis section]
A node started with a different `genesis` section computes a different genesis state and will reject (or diverge from) every block it receives. Always start from the canonical `config.json` and only adjust the runtime sections: `rpc`, `ws`, `p2p.listen`, and file paths.
:::


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
| `operator_address` | `string` | none | Your wallet; the node signs it into its identity attestation (verified node runner, validator registration). Set by `--operator` |
| `compact_wire_height` | `u64` | `0` (testnet config: `1440000`) | Height from which gossip payloads are sent base64-encoded (~2.8× fewer bytes). Every build since 2026-09-15 decodes both forms |
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

#### `watchdog`: Liveness Watchdog

Node-local (not consensus). A node whose head stops advancing while the network moves on is wedged; the node exits and systemd restarts it (`Restart=always` in the installed unit). It never fires on a network-wide halt, because nothing is ahead to compare against.

| Parameter | Type | Testnet value | Description |
|-----------|------|---------------|-------------|
| `enabled` | `bool` | `true` | Run the watchdog thread |
| `stall_secs` | `u64` | `300` | Seconds the head may stay unchanged, with the network known to be ahead, before the node exits (code 3) |
| `min_gap_blocks` | `u64` | `60` | How far ahead the network must be for the stall to count |
| `lock_secs` | `u64` | `90` | Seconds the engine lock may be unobtainable before the node exits (code 4) |
| `reference_rpc` | `string` | `"https://rpc.mersennet.com"` | Second opinion on the network head besides gossip (gossip cannot report a height when the listener itself died); empty = gossip only |

#### `slashing`: Slashing Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `double_sign_bps` | `u64` | `500` | Double-sign penalty (5%) |
| `timeout_bps` | `u64` | `100` | Timeout penalty (1%) — only from precommit-timeout evidence; downtime on the testnet is handled by epoch jailing, not slashing |
| `escalation_step_bps` | `u64` | `25` | Penalty increase per offense (0.25%) |
| `escalation_max_bps` | `u64` | `1000` | Maximum penalty cap (10%) |
| `round_timeout_ms` | `u64` | `500` | Consensus round timeout (ms) |
| `unbonding_period` | `u64` | `2` | Legacy consensus-level unbonding delay (code default). Staking unbonding on the testnet is governed by `validator_set.unbonding_blocks` (7,200 blocks, ~4 h) for both delegations and validator self-stake |

#### `validator_set`: Open Validator Set

Consensus-critical — identical on every node; the installer refreshes it from the canonical config on upgrade. Details on [Become a Validator](/validators/become-a-validator).

| Parameter | Type | Testnet value | Description |
|-----------|------|---------------|-------------|
| `activation_height` | `u64` | `1348200` | Height from which registrations and epoch transitions apply (`0` = closed set) |
| `epoch_blocks` | `u64` | `1800` | Epoch length; the active set is recomputed at multiples of it |
| `min_self_stake_mrsn` | `u64` | `1000` | Minimum self-stake to be eligible, in whole MRSN |
| `max_validators` | `usize` | `12` | Size of the active set (top by self + delegated stake) |
| `unbonding_blocks` | `u64` | `7200` | Blocks before an exiting validator's self-stake is withdrawable |
| `jail_miss_bps` | `u64` | `2000` | Missed-slot share (basis points) above which a validator is jailed for the next epoch |
| `jail_min_slots` | `u64` | `5` | Minimum leader slots in the epoch before the miss share is judged |
| `rewards_to_operator_height` | `u64` | `1440000` | Height from which a validator's block reward is credited to its operator wallet instead of the node identity (`0` = never) |
| `jail_escalation_height` | `u64` | `1569600` | Height from which consecutive jails last 1, 2, 4, 8, 16, 24 epochs instead of always one (`0` = never) |
| `bench_height` | `u64` | `1569600` | Height from which a validator that missed 3 leader slots in an epoch (misses ≥ a tenth of its proposals) leaves the leader rotation until the epoch boundary (`0` = never) |

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

- **Testnet (chain ID 131071)**: use the `config.json` from the [release bundle](https://mersennet.com/downloads/) (or `networks/testnet/config.json` in the repository) — never edit its `genesis`, `engine.chain_id`, or `token_economics` sections.
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
| `head not advancing, but no evidence the network is ahead` | Either the whole network is paused or this node has no peers and no reference RPC | Check `Peers` in `mersennet-check` and the explorer |
| `head has not advanced while the network moved on — exiting` | The watchdog restarted the node (`systemctl show mersennet -p NRestarts`) | Nothing, unless it repeats — then send the log through the feedback form |

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
