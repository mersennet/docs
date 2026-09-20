---
title: "Deployed Contracts"
---

Reference of contracts deployed on Mersennet testnet (Chain ID 131071). All addresses below are live on the current chain (redeployed August 2026 after the fresh-genesis reset; addresses are unchanged from the previous chain).

:::caution[Testnet resets]
Testnet state is only wiped at a re-genesis (last: August 2026); scheduled protocol upgrades keep state and addresses. After a re-genesis, contracts are redeployed and this page is updated — treat this page as the source of truth for addresses.
:::

## Native Precompiles

| Contract | Address | Description |
|----------|---------|-------------|
| **MersennetOrders** | `0x0000000000000000000000000000000000000100` | Native CLOB matching engine. `placeOrder`, `placeOrderExt`, `cancelOrder`, `createMarket` (permissionless listing, 100 MRSN fee), `depositCollateral`, `withdrawCollateral`, `depositTokenCollateral`, `withdrawTokenCollateral`, `getPosition`, `getCollateral`, `getTokenCollateral`, `getBestBidAsk`; `setAgent`, `revokeAgent`, `agentOf` (since block 1,569,600); `liquidate` (from block 1,605,600). Collateral (native MRSN and registered tokens like USDC) is fully escrowed at this address. |
| **MersennetStaking** | `0x0000000000000000000000000000000000000400` | Delegated staking and the open validator set. `delegate`, `undelegate`, `claimRewards`, `withdrawUnbonded`; `registerValidator`, `addSelfStake`, `unregisterValidator`, `rotateValidatorKey`. |

## Foundation

| Contract | Address | Description |
|----------|---------|-------------|
| **Multicall3** | `0xdc27E8F5F77721f5930B8C90FADe391E28331Da6` | Batched RPC reads. Used by wagmi, viem, ethers.js for efficient multi-call queries. |
| **Maker Vault** | `0xe77F94c4Bf7D6d2E2371aFdE440a0b9b8a567725` | Pooled market-maker capital; shares `mvMRSN`; deposits from block 1,605,600 ([Maker Vault](/ecosystem/maker-vault/)). |
| **WMRSN** | `0x5bBF04528469591280D36D46209c7CCD5a68a798` | ERC-20 wrapped MRSN for protocols that need an ERC-20 representation of the native token. |

## Mock Tokens

| Contract | Address | Description |
|----------|---------|-------------|
| **MockUSDC** | `0xA44B23d1D0C0133dA71DeCe399d5d5aDE6DD22d1` | Test USDC (6 decimals). |
| **MockUSDT** | `0x3923578a19d0e9B35cef08B7Eba0cb6D4B9c28F6` | Test USDT (6 decimals). |
| **MockDAI** | `0x27942c2cEE3e0e02377d01BFE6E74cefC9a9FD45` | Test DAI (18 decimals). |

:::note[Testnet Token Faucet]
Mock tokens include a public `faucet()` function — anyone can call it to mint 10,000 test tokens, no approval or whitelist required. The [Faucet](https://faucet.mersennet.com) can also send them to you with one click.
:::

## Quick Reference (Copy-Paste)

```
Chain ID: 131071
MersennetOrders CLOB: 0x0000000000000000000000000000000000000100 (precompile)
Multicall3:           0xdc27E8F5F77721f5930B8C90FADe391E28331Da6
WMRSN:                0x5bBF04528469591280D36D46209c7CCD5a68a798
MockUSDC:             0xA44B23d1D0C0133dA71DeCe399d5d5aDE6DD22d1
MockUSDT:             0x3923578a19d0e9B35cef08B7Eba0cb6D4B9c28F6
MockDAI:              0x27942c2cEE3e0e02377d01BFE6E74cefC9a9FD45
```

## ABI Links

- **Block Explorer**: [https://explorer.mersennet.com](https://explorer.mersennet.com) — search by address and view contract details.
- **Source Code**: the contract sources ship with the node repository (Business Source License 1.1, publishing shortly); verified ABIs are on the explorer's contract pages.
- **Multicall3**: Standard [Multicall3](https://github.com/mds1/multicall3) ABI; compatible with wagmi/viem defaults.

## Usage Examples

### Get Test Tokens (Faucet)

```javascript
const usdc = new ethers.Contract(
  '0xA44B23d1D0C0133dA71DeCe399d5d5aDE6DD22d1',
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
    function createMarket(bytes32 symbol, uint256 tickSize, uint256 lotSize)
        external returns (uint64 marketId); // permissionless, 100 MRSN listing fee
}

IMersennetOrders constant CLOB = IMersennetOrders(0x0000000000000000000000000000000000000100);
```

EVM contracts compose atomically with the native order book — deposit, trade, and react to fills in a single transaction.
