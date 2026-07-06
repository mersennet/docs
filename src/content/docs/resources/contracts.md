---
title: "Deployed Contracts"
---

Reference of contracts deployed on Mersennet testnet (Chain ID 131071). All addresses below are live on the current chain (deployed 2026-07-06 after the consensus-overhaul reset).

:::caution[Testnet resets]
Testnet chain state may be wiped during protocol upgrades. When that happens, contracts are redeployed and this page is updated — always treat this page (or `deployments.json` in the contracts repository) as the source of truth for addresses.
:::

## Native Precompiles

| Contract | Address | Description |
|----------|---------|-------------|
| **MersennetOrders** | `0x0000000000000000000000000000000000000100` | Native CLOB matching engine. `placeOrder`, `cancelOrder`, `depositCollateral`, `withdrawCollateral`, `getPosition`, `getCollateral`, `getBestBidAsk`. Collateral is escrowed 1:1 in native MRSN at this address. |

## Foundation

| Contract | Address | Description |
|----------|---------|-------------|
| **Multicall3** | `0xcBF3BBCc74D851cc896Aa128F61557DF65e420Fc` | Batched RPC reads. Used by wagmi, viem, ethers.js for efficient multi-call queries. |
| **WMRSN** | `0xbB012E05C1b42c1F0Efa4509317fdB31A31aD640` | ERC-20 wrapped MRSN for protocols that need an ERC-20 representation of the native token. |

## Mock Tokens

| Contract | Address | Description |
|----------|---------|-------------|
| **MockUSDC** | `0x8F4E0beE0fE201f10419947A7C043003F16BfD73` | Test USDC (6 decimals). |
| **MockUSDT** | `0x6fbE796cAA747D84E3aC7611fFc2dC6D11124eD4` | Test USDT (6 decimals). |
| **MockDAI** | `0x04833e1Be9c451A89fC6cD1e5E698E2D4936d7F9` | Test DAI (18 decimals). |

:::note[Testnet Token Faucet]
Mock tokens include a public `faucet()` function — anyone can call it to mint 10,000 test tokens, no approval or whitelist required. The [Faucet](https://faucet.mersennet.com) can also send them to you with one click.
:::

## Quick Reference (Copy-Paste)

```
Chain ID: 131071
MersennetOrders CLOB: 0x0000000000000000000000000000000000000100 (precompile)
Multicall3:           0xcBF3BBCc74D851cc896Aa128F61557DF65e420Fc
WMRSN:                0xbB012E05C1b42c1F0Efa4509317fdB31A31aD640
MockUSDC:             0x8F4E0beE0fE201f10419947A7C043003F16BfD73
MockUSDT:             0x6fbE796cAA747D84E3aC7611fFc2dC6D11124eD4
MockDAI:              0x04833e1Be9c451A89fC6cD1e5E698E2D4936d7F9
```

## ABI Links

- **Block Explorer**: [https://explorer.mersennet.com](https://explorer.mersennet.com) — search by address and view contract details.
- **Source Code**: Mersennet contracts repository (see [GitHub](https://github.com/mersennet)).
- **Multicall3**: Standard [Multicall3](https://github.com/mds1/multicall) ABI; compatible with wagmi/viem defaults.

## Usage Examples

### Get Test Tokens (Faucet)

```javascript
const usdc = new ethers.Contract(
  '0x8F4E0beE0fE201f10419947A7C043003F16BfD73',
  ['function faucet() external'],
  signer
);
await usdc.faucet(); // mints 10,000 USDC to the caller
```

### Wrap MRSN

```solidity
// WMRSN
function deposit() external payable;
function withdraw(uint256 wad) external;
```

### Trade on the CLOB from a contract

```solidity
interface IMersennetOrders {
    function depositCollateral(uint256 amount) external returns (bool);
    function placeOrder(uint64 marketId, bool isBuy, uint256 price, uint256 size, uint8 tif)
        external returns (uint256 orderId, uint256 filled, uint256 remaining);
}

IMersennetOrders constant CLOB = IMersennetOrders(0x0000000000000000000000000000000000000100);
```

EVM contracts compose atomically with the native order book — deposit, trade, and react to fills in a single transaction.
