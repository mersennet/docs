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
| `-32601` | Method not found | Typo in the method name, or calling a `mersennet_*` shielded method on a pre-privacy node. See [Methods](/developers/rpc/methods/). |
| `-32602` | Invalid params | Wrong type, missing field, or malformed hex (addresses are 20 bytes `0x…`, hashes 32 bytes). The message names the offending parameter. |
| `-32000` | Execution error | Generic server-side failure while executing the request — the message carries the underlying reason. |

## Transaction submission

| Code | Meaning | Typical cause & fix |
|------|---------|---------------------|
| `-32005` | Transaction rejected | The mempool refused the transaction. The `data` field carries the rejection reason: nonce too low, insufficient balance, fee below floor, wrong chain ID (testnet `131071`, mainnet `8191`), invalid signature, or a full queue. |

## Order book (`mersennet_orders_*`)

| Code | Error | Fix |
|------|-------|-----|
| `-32010` | Unknown market | Market ID doesn't exist — list markets first. |
| `-32011` | Invalid size | Size violates the market's lot size or is zero. |
| `-32012` | FOK not fillable | A fill-or-kill order couldn't be fully matched. Retry as `GTC`/`IOC` or adjust price. |
| `-32013` | Insufficient collateral | Deposit collateral before placing the order. |
| `-32014` | Insufficient equity | Position equity can't support the new order's margin requirement. |
| `-32015` | Market halted | The market is paused by governance. |
| `-32016` | Withdrawal exceeds equity | Withdraw less, or close positions first. |

## Privacy / shielded

| Code | Meaning | Fix |
|------|---------|-----|
| `-32604` | Forbidden | The viewing key or grant doesn't authorize this read. Check the grant's `scope` and expiry — see [Selective Disclosure](/privacy/selective-disclosure/). |
| `-32605` | Method disabled | Shielded methods are gated behind the privacy hard fork. Before activation, mutation methods return this code. |

:::tip[Debugging checklist]
1. Wrong network? `eth_chainId` should return `0x1ffff` (testnet) or `0x1fff` (mainnet).
2. Stale nonce? `eth_getTransactionCount(addr, "pending")`.
3. Shielded call failing? Confirm privacy is active: `mersennet_getLatestStateProof` returns a proof only post-activation.
:::
