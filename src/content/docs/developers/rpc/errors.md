---
title: "Error Reference"
description: "Every JSON-RPC error code Mersennet returns, what causes it, and how to fix it."
---

Every error the Mersennet RPC can return, in one place. Errors follow the
JSON-RPC 2.0 envelope:

```json
{ "jsonrpc": "2.0", "id": 1, "error": { "code": -32602, "message": "invalid address" } }
```

## Standard JSON-RPC

| Code | Meaning | Typical cause & fix |
|------|---------|---------------------|
| `-32700` | Parse error | Request body is not valid JSON. Check `Content-Type: application/json` and quoting. |
| `-32600` | Invalid request | Malformed JSON-RPC envelope, empty batch, more than 100 calls in a batch, or a body over 2 MiB. |
| `-32601` | Method not found | Typo in the method name; a method disabled on this node (`eth_sendTransaction`, `mersennet_orders_addMarket` / `setMarginParams` / `liquidate` over RPC); or any non-subscription method sent over the WebSocket endpoint (`WS: method not supported`). See [Methods](/developers/rpc/methods/). |
| `-32602` | Invalid params | Wrong type, missing field, or malformed hex (addresses are 20 bytes `0x…`, hashes 32 bytes). The message names the offending parameter. |
| `-32000` | Execution error | Generic server-side failure while executing the request: the message carries the underlying reason. |

## Transaction submission

| Code | Meaning | Typical cause & fix |
|------|---------|---------------------|
| `-32005` | Transaction rejected | The mempool refused the transaction. The `data` field carries the rejection reason: nonce too low, insufficient balance, fee below floor, wrong chain ID (testnet `131071`, mainnet `8191`), invalid signature, or a full queue. Also returned (with HTTP 429) when the per-IP rate limit of 100 requests/second is exceeded — back off and retry. |

## Order book (`mersennet_orders_*`)

| Code | Error | Fix |
|------|-------|-----|
| `-32604` | Unsigned mutation disabled | Unsigned `mersennet_orders_*` mutations are disabled on this node; submit a signed transaction to the precompile at `0x…0100`. |

CLOB business errors (unknown market, bad tick/lot size, insufficient collateral, withdrawal exceeds equity, …) surface as transaction reverts with a reason string when using the precompile path.

## Privacy / shielded

| Code | Meaning | Fix |
|------|---------|-----|
| `-32604` | Forbidden | The viewing key or grant doesn't authorize this read. Check the grant's `scope` and expiry; see [Selective Disclosure](/privacy/selective-disclosure/). |
| `-32605` | Method disabled | Shielded methods are gated behind the privacy hard fork: before activation, shielded mutations return this code. After the fork the transparent state, log and transaction-metadata methods (`eth_getLogs`, `eth_getTransactionByHash`, receipts, filters, `eth_getBalance`…) return it instead. |

:::tip[Debugging checklist]
1. Wrong network? `eth_chainId` should return `0x1ffff` (testnet) or `0x1fff` (mainnet).
2. Stale nonce? `eth_getTransactionCount(addr, "pending")`.
3. Shielded call failing? Confirm privacy activation by checking whether shielded mutations return `-32605` ("shielded methods are disabled until the privacy hard fork activates") — that indicates the fork has not activated.
:::
