---
title: "EVM Compatibility"
---

Mersennet implements an **EVM-compatible** execution environment, allowing developers to deploy and run existing Ethereum smart contracts with minimal or no modification. This document describes the EVM implementation, supported features, and differences from Ethereum mainnet.

## Overview

| Aspect | Mersennet |
|--------|-------------|
| **EVM Version** | Prague (revm `SpecId::PRAGUE_EOF`) |
| **Chain ID** | 131071 |
| **Token** | MRSN (18 decimals) |
| **Block Time** | ~2 seconds |

## Prague EVM

Mersennet runs the **Prague** EVM specification (revm `SpecId::PRAGUE_EOF`), which includes:

- All Shanghai features, including **PUSH0** (EIP-3855)
- Cancun features, including **transient storage** (`TSTORE`/`TLOAD`, EIP-1153) and **MCOPY** (EIP-5656)
- Prague-era additions

This means contracts compiled for any solc `evmVersion` up to Cancun deploy and run unchanged, ensuring compatibility with the vast majority of Solidity contracts and tooling (Hardhat, Foundry, Remix, and standard wallets).

## Supported Opcodes

Mersennet supports the standard Ethereum opcodes defined in the Prague spec, including:

- **Arithmetic**: ADD, SUB, MUL, DIV, MOD, etc.
- **Comparison**: LT, GT, SLT, SGT, EQ, etc.
- **Bitwise**: AND, OR, XOR, NOT, SHL, SHR, SAR
- **Crypto**: KECCAK256, ECRECOVER
- **Memory/Storage**: MSTORE, MLOAD, SLOAD, SSTORE
- **Control flow**: JUMP, JUMPI, PC, JUMPDEST
- **System**: CALL, DELEGATECALL, STATICCALL, CREATE, CREATE2
- **Block/Context**: BLOCKHASH, TIMESTAMP, NUMBER, etc.

## Precompiles

### Standard Ethereum Precompiles

Mersennet supports all standard Ethereum precompiles:

| Address | Precompile | Description |
|---------|------------|-------------|
| 0x01 | ecRecover | ECDSA signature recovery |
| 0x02 | SHA256 | SHA-256 hash |
| 0x03 | RIPEMD160 | RIPEMD-160 hash |
| 0x04 | identity | Identity (copy input to output) |
| 0x05 | modexp | Modular exponentiation |
| 0x06 | ecAdd | Elliptic curve point addition |
| 0x07 | ecMul | Elliptic curve scalar multiplication |
| 0x08 | ecPairing | BN254 pairing |
| 0x09 | blake2f | BLAKE2 compression function |
| 0x0a | KZG point evaluation | EIP-4844 point-evaluation precompile |
| 0x0b–0x11 | BLS12-381 | Prague BLS12-381 curve operations |

### Mersennet Extensions

Mersennet adds **custom precompiles** for native protocol features:

| Address | Precompile | Description |
|---------|------------|-------------|
| **0x0100** | **MersennetOrders** | Native on-chain CLOB: orders, markets, collateral |
| **0x0200** | Shielded transfer | Shielded-pool transfers (privacy hard fork) |
| **0x0201** | Shield / unshield bridge | Transparent ↔ shielded value movement (privacy hard fork) |
| **0x0202** | Code publication | Contract-code publication for the shielded EVM |
| **0x0300** | State-proof verifier | Verify SP1 state-transition proofs on-chain |
| **0x0400** | **MersennetStaking** | Delegated staking: `delegate`, `undelegate`, `claimRewards`, `withdrawUnbonded` |

See [MersennetOrders (On-chain CLOB)](/architecture/order-book) and the [Staking Guide](/validators/staking/) for full documentation.

## Gas Metering

Mersennet uses gas metering consistent with Ethereum:

- Each opcode has a cost (e.g. ADD = 3, SSTORE = 20,000 for cold)
- Transactions specify a `gasLimit`; execution stops if gas is exhausted
- Gas is paid in MRSN (converted at the current gas price)

Gas costs align with Ethereum's Prague spec for predictable behavior when porting contracts.

## Differences from Ethereum Mainnet

### Transaction Format

Mersennet uses a **custom binary transaction format** alongside standard Ethereum RLP-encoded (EIP-155) transactions, and `eth_sendRawTransaction` accepts both. Key points:

- Transactions include: `from`, `to`, `value`, `data`, `gasLimit`, `gasPrice`, `nonce`
- Chain ID 131071 is used for replay protection (testnet)

### EIP-1559 Base Fee (No Priority Tip)

Mersennet implements EIP-1559's dynamic base fee: the base fee adjusts each block based on target utilization (`fee_elasticity_multiplier: 2`, `fee_max_change_denominator: 8`, i.e. up to 12.5% change per block). There is **no separate priority tip**: `eth_maxPriorityFeePerGas` returns `0x0`.

Validators earn primarily from **block rewards**, not transaction fees. Fee market parameters can be updated via governance.

### Block Structure

Mersennet blocks include additional fields beyond standard Ethereum:

- **Rewards**: Per-validator block reward distribution
- **MersennetOrders events**: Order submissions, trades, liquidations (if applicable)

The RPC and block structure expose these for explorers and indexers.

### Native Token

- **Ethereum**: ETH (18 decimals)
- **Mersennet**: MRSN (18 decimals)

Same decimal precision, so contract logic that assumes 18 decimals works unchanged.

## Summary

| Feature | Status |
|---------|--------|
| Prague EVM | ✅ Supported |
| Standard opcodes | ✅ Supported |
| Standard precompiles | ✅ Supported |
| MersennetOrders precompile (0x0100) | ✅ Supported |
| MersennetStaking precompile (0x0400) | ✅ Supported |
| Custom tx format | ✅ Custom binary + Ethereum RLP (EIP-155) both accepted |
| EIP-1559 | ✅ Dynamic base fee (no priority tip) |
| Gas metering | ✅ Ethereum-compatible |

Mersennet is designed for **EVM ecosystem compatibility**: deploy your contracts, use your tools, and leverage the native MersennetOrders precompile for advanced DeFi strategies.
