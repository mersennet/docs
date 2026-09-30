---
title: "Deploy with Foundry"
description: "Build, test and deploy smart contracts to the Mersennet testnet with Foundry: forge, cast and the network settings."
---

This guide explains how to build and deploy smart contracts to Mersennet using Foundry. Mersennet's `eth_sendRawTransaction` accepts standard Ethereum RLP-encoded transactions (legacy, EIP-2930, and EIP-1559) in addition to its own custom binary format, so `forge create` and `cast send` work with locally signed transactions.

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- A funded wallet (get testnet MRSN from the [faucet](https://faucet.mersennet.com))

## Foundry Configuration

Create or update `foundry.toml` in your project root:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.20"
optimizer = true
optimizer_runs = 200
evm_version = "prague"

[rpc_endpoints]
mersennet_testnet = "https://rpc.mersennet.com"
```

## Build Your Contracts

```bash
forge build
```

## Deploy with forge create

```bash
forge create src/MyToken.sol:MyToken \
  --rpc-url https://rpc.mersennet.com \
  --private-key $PRIVATE_KEY \
  --legacy \
  --broadcast \
  --constructor-args 1000000
```

The `--legacy` flag is recommended: Mersennet implements an EIP-1559 base fee but no priority tip (`eth_maxPriorityFeePerGas` returns `0x0`), so legacy gas-price transactions are the simplest fit.

## Node.js Deployment Helper

Alternatively, use a Node.js script with ethers.js, which signs locally and submits via `eth_sendRawTransaction`.

### 1. Create a deploy script

Create `scripts/deploy.js`:

```javascript
const { ethers } = require("ethers");

const RPC_URL = "https://rpc.mersennet.com";
const CHAIN_ID = 131071;

async function main() {
  // Sign locally with the private key; ethers submits via eth_sendRawTransaction
  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const factory = new ethers.ContractFactory(
    require("./MyToken_abi.json"),
    require("./MyToken_bytecode.json"),
    wallet
  );

  const contract = await factory.deploy(1_000_000);
  await contract.waitForDeployment();

  console.log("Deployed to:", await contract.getAddress());
}

main().catch(console.error);
```

### 2. Compile and extract artifacts

```bash
forge build
```

Then create a script that reads Foundry artifacts:

```javascript
// deploy-with-forge-artifacts.js
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const RPC_URL = "https://rpc.mersennet.com";
const CHAIN_ID = 131071;

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const artifactPath = path.join(__dirname, "../out/MyToken.sol/MyToken.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode.object,
    wallet
  );

  const contract = await factory.deploy(1_000_000);
  await contract.waitForDeployment();

  console.log("MyToken deployed to:", await contract.getAddress());
}

main().catch(console.error);
```

### 3. Run the deploy script

```bash
npm install ethers
PRIVATE_KEY=0x_your_key node deploy-with-forge-artifacts.js
```

:::tip
ethers.js v6 signs the transaction locally and submits it with `eth_sendRawTransaction`. Mersennet accepts standard Ethereum RLP-encoded transactions, so this works out of the box.
:::

## Cast

`cast` works for both reads and writes:

```bash
# Get balance
cast balance 0xYourAddress --rpc-url https://rpc.mersennet.com

# Call a view function
cast call 0xContractAddress "totalSupply()(uint256)" --rpc-url https://rpc.mersennet.com

# Get chain ID
cast chain-id --rpc-url https://rpc.mersennet.com

# Send a transaction (signed locally)
cast send 0xRecipient --value 1ether --legacy \
  --rpc-url https://rpc.mersennet.com --private-key $PRIVATE_KEY
```

## Summary

| Operation | Supported | Notes |
|-----------|-----------|-------|
| `forge build` | ✅ | |
| `forge test` | ✅ | Against local Anvil or Mersennet RPC |
| `forge create` | ✅ | Use `--legacy --broadcast` (Foundry 1.x dry-runs without `--broadcast`) |
| `cast call` | ✅ | Read-only |
| `cast send` | ✅ | Use `--legacy` |
| `eth_sendTransaction` | ❌ | Disabled — returns `-32601`; use `eth_sendRawTransaction` |
| `eth_feeHistory` | ✅ | Supported (the `reward` array is empty — no priority tip) |
