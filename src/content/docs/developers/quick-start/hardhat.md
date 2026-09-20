---
title: "Deploy with Hardhat"
---

This guide walks you through setting up Hardhat and deploying a smart contract to Mersennet testnet (Chain ID 131071).

## Prerequisites

- Node.js 18+ and npm
- A funded wallet (get testnet MRSN from the [faucet](https://faucet.mersennet.com))

## Installation

Create a new project or use an existing one:

```bash
mkdir my-mersennet-dapp && cd my-mersennet-dapp
npm init -y
npm install --save-dev hardhat@^2 @nomicfoundation/hardhat-toolbox@^5
npx hardhat init
```

Select **Create a TypeScript project** when prompted.

## Network Configuration

Add Mersennet to your `hardhat.config.ts`:

This guide targets **Hardhat 2.x** (pinned above). Hardhat 3 changed the config format (`type: "http"` networks, a `plugins` array, `network.connect()` in scripts); if you already use Hardhat 3, follow its [network configuration reference](https://hardhat.org/docs/reference/configuration) with the same URL, chain ID and account settings.

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    mersennet: {
      url: "https://rpc.mersennet.com",
      chainId: 131071,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
```

:::note[Fee estimation on Mersennet]
Mersennet uses standard JSON-RPC, including `eth_feeHistory` — its `reward` array is empty, since there is no priority tip. If you encounter issues with gas estimation, you may need to adjust `timeout` in the network config or pin a fixed `gasPrice`. Deployment works with locally signed transactions via `eth_sendRawTransaction` (the Hardhat default).
:::

## Sample ERC-20 Contract

Create `contracts/MyToken.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}
```

Install OpenZeppelin:

```bash
npm install @openzeppelin/contracts
```

## Deployment Script

Create `scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy(1_000_000); // 1M tokens
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log("MyToken deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Deploy to Mersennet

1. **Set your private key** (never commit this):

```bash
export PRIVATE_KEY="0x_your_private_key_here"
```

2. **Fund your wallet** from the [faucet](https://faucet.mersennet.com).

3. **Run the deployment**:

```bash
npx hardhat run scripts/deploy.ts --network mersennet
```

Expected output:

```
Deploying with account: 0x...
Account balance: 1001000000000000000000
MyToken deployed to: 0x...
```

## Verify Deployment

Query the deployed contract:

```bash
npx hardhat console --network mersennet
```

```javascript
const token = await ethers.getContractAt("MyToken", "0xYourDeployedAddress");
const name = await token.name();
const supply = await token.totalSupply();
console.log(name, supply.toString());
```

Or use the [block explorer](https://explorer.mersennet.com) to view the transaction and contract.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Fee estimation looks off | `eth_feeHistory` is supported, but its `reward` array is empty (no priority tip on Mersennet); tooling that indexes `reward[i][j]` needs a pinned `gasPrice`. Legacy gas-price transactions are the simplest fit. |
| Gas estimation fails | Try increasing `gasLimit` in the deployment script or use a fixed value (e.g., `3000000`). |
| Connection refused | Ensure the RPC URL `https://rpc.mersennet.com` is reachable from your network. |
| Insufficient funds | Get testnet MRSN from the [faucet](https://faucet.mersennet.com). |
