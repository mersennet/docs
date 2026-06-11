# MersennetOrders + MersennetEVM Architecture (Draft)

## Goal
Provide a dual-system chain: **MersennetOrders** (high‑throughput order book + risk engine) and **MersennetEVM** (smart contract execution). Both settle to a shared canonical state with deterministic transitions and finality.

## High-Level Components
- **MersennetOrders Core**
  - Matching engine (price/time priority).
  - Risk engine (margin, liquidation, position limits).
  - Market data pipeline (order book, trades, funding index).
- **MersennetEVM Runtime**
  - Standard EVM execution (already in `engine.rs`).
  - Contract deployment, calls, logs, receipts.
- **Settlement Layer**
  - Canonical balances/positions state shared across both systems.
  - State root commitment per block.
- **Bridge & Queue**
  - Deterministic queues for messages between MersennetOrders and MersennetEVM.
  - Replay protection, nonce ordering, and finality semantics.

## Data Model (First Pass)
- **Accounts**: balances, open orders, positions, margin, nonce.
- **Markets**: instrument metadata, tick size, lot size, fee tiers.
- **Orders**: id, owner, side, price, size, tif, status.
- **Positions**: size, entry price, pnl, maintenance margin.
- **Funding**: funding index, rate, payment schedule.

## Protocol Flow (Per Block)
1. **MersennetOrders ingest**: validate orders, match, emit trades.
2. **Risk checks**: update margin/positions, trigger liquidations.
3. **Settlement write**: update balances/positions in shared state.
4. **MersennetEVM exec**: execute mempool txs against updated state.
5. **Finalize**: compute state root and commit block.

## RPC Surface (Additions)
- **MersennetOrders RPC**
  - `mersennet_orders_submitOrder`
  - `mersennet_orders_cancelOrder`
  - `mersennet_orders_getOrderBook`
  - `mersennet_orders_getOpenOrders`
  - `mersennet_orders_getPositions` *(planned — not yet implemented)*
  - `mersennet_orders_getTrades` *(planned — not yet implemented)*
- **MersennetEVM**
  - Keep existing JSON‑RPC methods for EVM.

## MersennetOrders RPC Usage (Draft)
All methods are JSON‑RPC 2.0 over HTTP POST.

### Add Market
**Method**: `mersennet_orders_addMarket`

**Params**: `[symbol, tickSize, lotSize]`

**Example params**:
- `"MERSENNET-PERP"`
- `"0x1"`
- `"0x1"`

**Returns**: hex-encoded market id.

### Submit Order
**Method**: `mersennet_orders_submitOrder`

**Params**: `[order]`

**Order fields**:
- `owner` (0x address)
- `market_id` (number)
- `side` ("buy" | "sell")
- `price` (hex U256)
- `size` (hex U256)
- `tif` (optional: "gtc" | "ioc" | "fok")

**Returns**: `order_id`, `filled`, `remaining`, `trades`.

### Cancel Order
**Method**: `mersennet_orders_cancelOrder`

**Params**: `[orderId]` (hex or number)

**Returns**: `true` if cancelled.

### Order Book
**Method**: `mersennet_orders_getOrderBook`

**Params**: `[marketId]` (hex or number)

**Returns**: bids/asks arrays of `{ price, size }`.

### Open Orders
**Method**: `mersennet_orders_getOpenOrders`

**Params**: `[owner]` (0x address)

**Returns**: open order list.

### Margin Parameters
**Method**: `mersennet_orders_setMarginParams`

**Params**: `[initial_bps, maintenance_bps]`

**Example params**:
- `5000` (50% initial)
- `2000` (20% maintenance)

**Returns**: `true`.

### Deposit Collateral
**Method**: `mersennet_orders_depositCollateral`

**Params**: `[owner, amount]`

**Example params**:
- `"0x1111111111111111111111111111111111111111"`
- `"0x64"` (100)

**Returns**: `true`.

### Liquidation Checks
**Method**: `mersennet_orders_isLiquidatable`

**Params**: `[owner]`

**Returns**: `true` or `false`.

### Liquidate
**Method**: `mersennet_orders_liquidate`

**Params**: `[owner]`

**Returns**: `true` if liquidation executed.

## Domain Events
Blocks now include deterministic domain events for MersennetOrders and the bridge. You can query the event index via RPC.

**Method**: `mersennet_getDomainEvents`

**Params**: `[filter]`

**Filter fields**:
- `fromBlock` (optional): hex block number or `"latest"`. Defaults to `0`.
- `toBlock` (optional): hex block number or `"latest"`. Defaults to `latest`.
- `domain` (optional): `"mersennetorders"` or `"bridge"`.
- `kind` (optional): event kind string (e.g., `"order_submitted"`, `"trade"`, `"bridge_enqueued"`).

**Example params**:
```json
{
  "fromBlock": "0x1",
  "toBlock": "latest",
  "domain": "mersennetorders",
  "kind": "order_submitted"
}
```

## Consensus Requirements
- Validators must verify **both** MersennetOrders and MersennetEVM transitions.
- Block must include deterministic MersennetOrders event set + EVM receipts.

## Milestones
1. **State schema**: implement MersennetOrders state tables (accounts, orders, positions).
2. **Matching engine**: deterministic order matching, basic order types (limit/market).
3. **Risk engine**: initial/maintenance margin, liquidation, funding.
4. **Bridge**: cross‑domain message queue with ordering + replay protection.
5. **RPC**: expose MersennetOrders endpoints + data streaming.
6. **Tests**: matching determinism, liquidation correctness, state sync.

## Open Questions
- Fee model (maker/taker, rebates).
- Funding cadence and oracle sources.
- On-chain vs off-chain order routing.

## Snapshot Sync (TCP)
Use the CLI to stream state snapshots over TCP in chunks with hash verification.

**Serve a snapshot**:
```
mersennet --snapshot-listen 127.0.0.1:43000
```

**Fetch a snapshot**:
```
mersennet --snapshot-fetch 127.0.0.1:43000 --snapshot-out snapshot.bin
```

**Optional tuning**:
- `--snapshot-chunk-size <bytes>` (default: 262144)
- `--snapshot-max-bytes <bytes>` (default: 268435456)

## Node Identity + Peer Store
Each node persists a local identity key and a peer list for UDP gossip.

**Identity key path**:
- `--node-key-path <path>` (default: `state/node_key.json`)

**Peer store path**:
- `--peer-store-path <path>` (default: `state/peers.json`)

## Health Endpoint
`GET /health` returns a JSON payload with `status`, `height`, and `chain_id`.
