---
title: "JSON-RPC Overview"
---

Mersennet exposes a JSON-RPC API compatible with the Ethereum JSON-RPC specification, plus Mersennet–specific extensions. Use it to query chain state, send transactions, and interact with smart contracts.

## Endpoints

| Environment | HTTP RPC | WebSocket |
|-------------|----------|-----------|
| Testnet | `https://rpc.mersennet.com` | `wss://rpc.mersennet.com` |

:::tip
The WebSocket endpoint may not be enabled on all nodes. If subscriptions fail, use HTTP RPC for polling.
:::

## Authentication

**Testnet:** No authentication is required. The public RPC endpoint is open for development and testing.

**Mainnet (future):** API keys or authenticated endpoints may be introduced. Check the documentation for updates.

## Rate Limits

The testnet RPC enforces a per-IP limit of 100 requests/second. Exceeding it returns HTTP 429 with JSON-RPC error `-32005`. For high-volume applications, consider:

- Running your own node
- Implementing client-side throttling
- Caching read-only data (blocks, balances, contract state)

## Request Format

All requests use JSON-RPC 2.0 over HTTP POST:

```bash
curl -X POST https://rpc.mersennet.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

Response:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1ffff"
}
```

## Method Categories

### Standard Ethereum Methods

Mersennet supports the core Ethereum JSON-RPC methods:

- **Block/Chain:** `eth_blockNumber`, `eth_chainId`, `eth_getBlockByNumber`, `eth_getBlockByHash`
- **Account:** `eth_getBalance`, `eth_getTransactionCount`, `eth_getCode`, `eth_getStorageAt`
- **Transaction:** `eth_getTransactionByHash`, `eth_getTransactionReceipt`, `eth_sendTransaction`, `eth_sendRawTransaction`
- **Execution:** `eth_call`, `eth_estimateGas`, `eth_gasPrice`, `eth_feeHistory`, `eth_maxPriorityFeePerGas`
- **Logs:** `eth_getLogs`
- **Filters:** `eth_newFilter`, `eth_newBlockFilter`, `eth_newPendingTransactionFilter`, `eth_getFilterChanges`, `eth_getFilterLogs`, `eth_uninstallFilter`

See [RPC Methods Reference](/developers/rpc/methods) for full details.

### Mersennet Extensions

| Method | Description |
|--------|-------------|
| `mersennet_sendTransaction` | **Disabled** — returns `-32601`; sign locally and submit via `eth_sendRawTransaction` |
| `mersennet_validators` | Current consensus set with voting stake |
| `mersennet_validatorSet` | Open validator set: parameters, epoch, registrations and statuses |
| `mersennet_nodeIdentity` | This node's identity, operator and registration proof (local RPC) |
| `mersennet_peers` | Gossip peers of this node (address, first/last seen, heard) |
| `mersennet_getDomainEvents` | Get domain events for a block range |
| `mersennet_getCodeAttestation` / `mersennet_getCodeHash` | On-chain contract code-publication registry lookups |
| `mersennet_orders_*` | MersennetOrders trading methods (submitOrder, cancelOrder, depositCollateral, getOrderBook, getOpenOrders). Writes route through consensus and return `{accepted, txHash}` (unsigned write RPCs are disabled on public endpoints — submit signed precompile transactions instead). |
| `mersennet_bridge_*` | MersennetBridge bridge methods (enqueueOrdersToEvm, enqueueEvmToOrders, dequeueOrdersToEvm, dequeueEvmToOrders) |
| **Shielded / ZK** | Shielded transfers & orders, SP1 state proofs, and selective-disclosure reads; see the [Shielded JSON-RPC reference](/developers/privacy/shielded-rpc) |
| **WebSocket** | `eth_subscribe` and `mersennet_subscribe` push notifications (new heads, trades, shielded roots, state proofs) |

### Notes on specific methods

| Method | Notes |
|--------|-------|
| `eth_subscribe` / `eth_unsubscribe` | Available over **WebSocket connections only** (not HTTP). May be disabled on some public nodes; fall back to filters/polling. |
| `eth_maxPriorityFeePerGas` | Returns `0x0`: Mersennet uses an EIP-1559 base fee with no separate priority tip. |
| `debug_*` / `trace_*` / `personal_*` | Not implemented. |

## Transaction Format

:::note
`eth_sendRawTransaction` accepts **both** standard Ethereum RLP-encoded transactions (legacy, EIP-2930, EIP-1559) and Mersennet's custom binary format. MetaMask-, ethers.js-, and Foundry-signed transactions work natively.
:::

For deployment and sending transactions, you can use:

- **Hardhat / Foundry / ethers.js** signing locally and submitting via `eth_sendRawTransaction`
- **Remix** with MetaMask (injected provider)
- **eth_sendRawTransaction** for all flows — sign locally with your tooling of choice; unlocked-account submission is not supported

## Error Handling

Errors follow the JSON-RPC error format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "insufficient funds for transfer"
  }
}
```

Common error codes:

| Code | Meaning |
|------|---------|
| -32700 | Parse error |
| -32600 | Invalid request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32000 | Server error (e.g., insufficient funds, revert) |
