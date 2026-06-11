---
title: "Mersennet Wallet"
---

**Mersennet Wallet** is the native browser extension wallet for Mersennet. It provides send/receive, token management, dApp connectivity, and transaction signing—optimized for the Mersennet ecosystem.

## Overview

| Feature | Mersennet Wallet |
|---------|-----------------|
| **Platform** | Chrome/Chromium extension |
| **Standard** | EIP-1193 (MetaMask-compatible) |
| **Chain** | Mersennet (Chain ID 131071) supported out of the box |
| **Stack** | React, ethers.js, Chrome Manifest V3 |
| **Status** | Built |

## Features

### Send & Receive MRSN

- Send native MRSN to any address on Mersennet.
- Receive MRSN by sharing your wallet address.
- View transaction history and confirmations.

### Token Management

- View ERC-20 token balances (WMRSN, USDC, USDT, etc.).
- Send and receive tokens.
- Add custom tokens by contract address.

### dApp Connectivity

- Connect to Mersennet dApps via the standard Ethereum provider (`window.ethereum`).
- Approve transactions and sign messages.
- Compatible with wagmi, ethers.js, viem, and other Web3 libraries.

### Transaction Signing

- Sign transactions with your private key (stored locally, never transmitted).
- Approve token allowances for DeFi protocols.
- Sign typed data (EIP-712) for Seaport and other protocols.

## Installation

1. Install the Mersennet Wallet browser extension (Chrome/Chromium).
2. Create a new wallet or import via seed phrase.
3. Mersennet testnet (Chain ID 131071) is preconfigured.
4. Use the [Faucet](https://faucet.mersennet.com) to get testnet MRSN.

:::tip
Mersennet Wallet uses the same provider interface as MetaMask. dApps that support MetaMask can connect to Mersennet Wallet when it's installed.
:::

## Mobile Wallet

**Mersennet Wallet Mobile** is a React Native wallet for iOS and Android:

- Same functionality as the browser extension.
- APK available for Android.
- Send, receive, token management, and dApp connectivity on mobile.

## Supported dApps

Mersennet Wallet works with all Mersennet dApps, including:

- [Mersennet Swap](/ecosystem/swap) — Swap and add liquidity
- [Mersennet Lend](/ecosystem/lend) — Supply and borrow (when deployed)
- [Mersennet NFTs](/ecosystem/nfts) — NFT marketplace (when deployed)
- Block Explorer — View transactions and addresses

## Alternative: MetaMask

If you prefer MetaMask, you can add Mersennet manually. See [Wallet Setup](/getting-started/wallet-setup) for instructions. Mersennet Wallet offers a tailored experience and may include Mersennet–specific features (e.g., MersennetOrders integration) in future updates.

## Security

- Private keys and seed phrases never leave your device.
- No data is sent to external servers for key management.
- Always verify contract addresses and transaction details before signing.

## Related Resources

- [Wallet Setup](/getting-started/wallet-setup) — Add Mersennet to MetaMask or Mersennet Wallet
- [Faucet](/getting-started/faucet) — Get testnet MRSN
- [First Transaction](/getting-started/first-transaction) — Send your first MRSN
