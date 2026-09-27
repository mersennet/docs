---
title: Maker Vault
description: Pool MRSN behind the market maker on the on-chain order book. Shares track the vault's net asset value; deposits earn LP points.
---

The Maker Vault is an on-chain strategy vault on the Mersennet testnet: depositors pool native MRSN, the vault holds it as collateral on the order-book precompile, and a manager-approved **agent key** quotes both sides of the book on the vault's behalf. Shares track the vault's net asset value (NAV), so market-making PnL — positive or negative — accrues to depositors.

| | |
|---|---|
| Contract | `0xe77F94c4Bf7D6d2E2371aFdE440a0b9b8a567725` ([explorer](https://explorer.mersennet.com/address/0xe77F94c4Bf7D6d2E2371aFdE440a0b9b8a567725)) |
| Share token | `mvMRSN` (18 decimals, non-transferable accounting inside the vault) |
| Asset | native MRSN |
| Minimum deposit | 1 MRSN |
| Deposits opened | block 1,605,600 — the settlement / frame-caller upgrade of 20 Sep 2026 (activation record on the [upgrades page](https://explorer.mersennet.com/upgrades)) |
| LP points | 0.1 point per MRSN per day while deposited ([Points](https://trade.mersennet.com/points)) |
| UI | [trade.mersennet.com/vault](https://trade.mersennet.com/vault) |

:::note[Why it needs the 1,605,600 upgrade]
Before that height the precompiles authorised the *transaction origin*, so a contract could not hold its own order-book account. From block 1,605,600 precompiles authorise the calling frame (`msg.sender`), and the vault acts as itself: its collateral, orders and positions belong to the contract, never to the agent or the manager.
:::

## How it works

1. **Deposit.** `deposit()` with MRSN as the call value mints shares at the current share price (`nav / totalShares`; 1 share = 1 MRSN when the vault is empty). The terminal's vault page does this for you.
2. **Quote.** The manager pushes free MRSN onto the precompile as collateral (`pushCollateral`) and grants a bot an agent key (`setAgent(agent, expiresAtBlock)`, revocable at any time). The agent places and cancels orders **as the vault**; it can never deposit, withdraw or move collateral. The manager keeps a reserve of the vault's assets free (10% on the testnet) so withdrawals do not have to wait for positions to close. The order book enforces a 10% initial margin against the vault's collateral, and the agent sizes its quotes to that collateral — so deposits translate directly into book depth, and the vault can never be quoted beyond what it holds.
3. **Withdraw.** `withdraw(shares)` burns shares and pays `shares × nav / totalShares` in MRSN, from the free balance first and then from precompile collateral that is not backing an open position. If more collateral is in use than the withdrawal needs, the call reverts with `collateral in use` — try again shortly or with a smaller amount.

NAV = free MRSN in the contract + collateral on the precompile + unrealized PnL of open positions marked at the order-book mid. Every figure the contract exposes is in wei.

## Reading the vault

```solidity
interface IMakerVault {
    function nav() external view returns (uint256);          // wei
    function sharePrice() external view returns (uint256);   // wei per share (1e18 = 1 MRSN)
    function totalShares() external view returns (uint256);
    function sharesOf(address) external view returns (uint256);
    function depositors() external view returns (uint256);
    function collateral() external view returns (uint256);   // on the precompile, wei
    function unrealizedPnl() external view returns (int256); // signed, wei
    function deposit() external payable returns (uint256 shares);
    function withdraw(uint256 shares) external returns (uint256 amount);
}
```

The trade API mirrors the state for dashboards: `GET https://trade.mersennet.com/api/v1/vault/info` (parameters and whether deposits are open), `/vault/state` (TVL, shares, PnL, depositors) and `/vault/user/:address` (your shares, value and history).

## What can go wrong

- **The strategy loses money.** Market making carries inventory risk; share price can fall below 1 MRSN. Deposit test MRSN you are prepared to see move.
- **Withdrawals can be delayed.** Collateral backing open positions cannot be pulled; the reserve covers normal withdrawals, a large one may need a retry.
- **Testnet guard rails.** The manager can pause deposits, set a deposit cap, change the minimum deposit, change or revoke the agent, cancel orders and flatten positions in an emergency. Manager transfer is two-step (`transferManager` then `acceptManager`).

The contract source is `contracts/src/orders/MakerVault.sol` in the node repository (Business Source License 1.1, publishing shortly); the deployed bytecode is verifiable on the explorer.
