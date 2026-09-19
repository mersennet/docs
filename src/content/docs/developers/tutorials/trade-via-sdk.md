---
title: "Trade via SDK and RPC"
description: "Place a signed order on the Mersennet on-chain order book from TypeScript, Python or Go: configure the RPC, read the protocol parameters, deposit collateral with the unit helper, submit a limit order and read your orders and position back."
---

This tutorial does from code what [Your First Trade](/getting-started/first-trade/) does in the terminal. The flow is the same in every language:

1. Point the SDK at the public RPC `https://rpc.mersennet.com` (chain ID `131071`).
2. Read the live protocol parameters with `mersennet_orders_getProtocol`.
3. Read your collateral with an `eth_call` to the order-book precompile at `0x0000000000000000000000000000000000000100`.
4. Deposit collateral, converting MRSN to collateral units with the SDK helper.
5. Place a signed limit order.
6. Read your open orders and position.

Every write is a **wallet-signed transaction** to the precompile, submitted with `eth_sendRawTransaction`; the node returns a transaction hash and the order takes effect when the transaction mines (one or two blocks). There is no unsigned path on public endpoints. Fund the key you use from the [faucet](/getting-started/faucet/) first (1,001 MRSN per claim per hour).

:::note[Collateral units change at block 1,605,600]
`depositCollateral` and `withdrawCollateral` take **collateral units**. Before the settlement switch one unit is one wei (10¹⁸ units per MRSN); from block 1,605,600 one unit is one MRSN. Every SDK has a helper that reads `weiPerCollateralUnit` from `getProtocol` and converts for the current era — `toCollateralUnits("100")` in TypeScript, `to_collateral_units("100")` in Python, `ToCollateralUnits("100")` in Go. Use it instead of `1e18` literals, and your code keeps working through the switch.
:::

:::note[Prices are scaled]
On-chain prices are `human price × priceScale`. `priceScale` is 1 for every market today; from block 1,569,600 MRSN, SOL and ARB carry `priceScale = 100` ($0.01 ticks). Read the scale from `getMarkets` and convert with `toChainPrice`, as below, rather than assuming integers.
:::

## TypeScript

The TypeScript SDK is not on npm yet; install it from GitHub (`npm install github:mersennet/sdk-ts`) as described in [JavaScript SDK → Installation](/developers/sdks/javascript/#installation). Signing is delegated to you through a `TxSigner` callback — here an ethers `Wallet`.

```typescript title="trade.ts"
import { Wallet } from 'ethers';
import { MersennetProvider, MersennetOrders } from '@mersennet/sdk';

// 1. Configure the RPC
const provider = new MersennetProvider('https://rpc.mersennet.com');
const orders = new MersennetOrders(provider);
if ((await provider.getChainId()) !== 131071) throw new Error('not Mersennet testnet');

const wallet = new Wallet(process.env.PRIVATE_KEY!);
const signer = (tx) => wallet.signTransaction(tx); // TxSigner: signs the TxRequest the SDK builds

async function mined(txHash: string) {
  while (!(await provider.getTransactionReceipt(txHash))) {
    await new Promise((r) => setTimeout(r, 2000));
  }
}

// 2. Read the protocol: switches, margin, units
const protocol = await orders.getProtocol();
console.log('settlement active:', protocol.settlementActive,
  'initial margin bps:', protocol.initialMarginBps,
  'wei per collateral unit:', protocol.weiPerCollateralUnit);

// 3. Read collateral (eth_call to getCollateral() on the precompile, from = your address)
const perMrsn = await orders.collateralUnitsPerMrsn(); // 10n ** 18n before the switch, 1n from it
const units0 = BigInt(await orders.getCollateral(wallet.address));
console.log('collateral (MRSN):', Number(units0) / Number(perMrsn));

// 4. Deposit 100 MRSN — the helper converts to the current era's units
const deposit = await orders.depositCollateral(
  wallet.address,
  (await orders.toCollateralUnits('100')).toString(),
  signer
);
await mined(deposit.txHash);

// 5. Place a signed limit order: buy 1 MRSN at $110, good till cancelled
const mrsn = (await orders.getMarkets()).find((m) => m.symbol === 'MRSN')!;
const price = MersennetOrders.toChainPrice('110', mrsn); // 110n at priceScale 1, 11000n at 100
const ack = await orders.submitOrder(
  wallet.address, // sender — must be the signer's address
  mrsn.id,        // market id (1 = MRSN)
  'buy',
  price.toString(),
  '1',            // size, in lots
  'gtc',
  signer
);
console.log('order tx:', ack.txHash);
await mined(ack.txHash);

// 6. Read back
console.log('open orders:', await orders.getOpenOrders(wallet.address));
console.log('position:', await orders.getPosition(wallet.address, mrsn.id)); // { size, entry_price }
```

`submitOrder` builds the `placeOrder` calldata, fetches the nonce, gas price and chain ID, hands the transaction to your signer and broadcasts the result. To cancel, call `orders.cancelOrder(wallet.address, orderId, signer)` with an `id` from `getOpenOrders`. The full method list, including agent keys and liquidations, is in the [JavaScript SDK reference](/developers/sdks/javascript/#full-api-reference).

## Python

The Python SDK reads everything but has no signing helpers yet: build the calldata, sign it with `eth-account`, and submit it with `provider.send_raw_transaction()`.

```python title="trade.py"
import os
import time

import requests
from eth_account import Account
from mersennet import MersennetProvider, MersennetOrders

RPC = "https://rpc.mersennet.com"
PRECOMPILE = "0x0000000000000000000000000000000000000100"

# 1. Configure the RPC
provider = MersennetProvider(RPC)
orders = MersennetOrders(provider)
assert provider.chain_id() == 131071, "not Mersennet testnet"
acct = Account.from_key(os.environ["PRIVATE_KEY"])


def send(calldata: str, gas: int) -> str:
    """Sign a precompile transaction locally, submit it and wait until it mines."""
    signed = acct.sign_transaction({
        "to": PRECOMPILE,
        "data": calldata,
        "value": 0,
        "gas": gas,
        "gasPrice": int(provider.gas_price(), 16),
        "nonce": provider.get_nonce(acct.address),
        "chainId": 131071,
    })
    tx_hash = provider.send_raw_transaction(signed.raw_transaction.hex())
    while provider.get_transaction_receipt(tx_hash) is None:
        time.sleep(2)
    return tx_hash


# 2. Read the protocol: switches, margin, units
protocol = orders.get_protocol()
print("settlement active:", protocol["settlementActive"],
      "initial margin bps:", protocol["initialMarginBps"],
      "wei per collateral unit:", protocol["weiPerCollateralUnit"])

# 3. Read collateral: getCollateral() (selector 0x5c1548fb), from = your address
per_mrsn = orders.collateral_units_per_mrsn()   # 10**18 before the switch, 1 from it
raw = provider.call({"from": acct.address, "to": PRECOMPILE, "data": "0x5c1548fb"})
units_now = int(raw, 16) if raw not in ("", "0x") else 0
print("collateral (MRSN):", units_now / per_mrsn)

# 4. Deposit 100 MRSN: depositCollateral(uint256 amount), selector 0xbad4a01f
units = orders.to_collateral_units("100")
send("0xbad4a01f" + format(units, "064x"), 200_000)

# 5. Place a signed limit order: buy 1 MRSN at $110, GTC
#    placeOrder(uint64 marketId, bool isBuy, uint256 price, uint256 size, uint8 tif), selector 0x4c570d73
mrsn = next(m for m in orders.get_markets() if m["symbol"] == "MRSN")
price = orders.to_chain_price(110, mrsn["price_scale"])   # 110 at scale 1, 11000 at 100


def encode_place_order(market_id: int, is_buy: bool, price: int, size: int, tif: int) -> str:
    words = [market_id, 1 if is_buy else 0, price, size, tif]  # tif: 0 = GTC, 1 = IOC, 2 = FOK
    return "0x4c570d73" + "".join(format(w, "064x") for w in words)


tx_hash = send(encode_place_order(mrsn["id"], True, price, 1, 0), 300_000)
print("order tx:", tx_hash)

# 6. Read back: open orders over plain JSON-RPC, position via getPosition(uint64) (selector 0x0f85fc5a)
open_orders = requests.post(RPC, json={
    "jsonrpc": "2.0", "id": 1,
    "method": "mersennet_orders_getOpenOrders", "params": [acct.address],
}).json()["result"]
print("open orders:", open_orders)

raw = provider.call({"from": acct.address, "to": PRECOMPILE,
                     "data": "0x0f85fc5a" + format(mrsn["id"], "064x")})
if raw not in ("", "0x"):
    size, entry_price = int(raw[2:66], 16), int(raw[66:130], 16)
    print("position size:", size, "entry price:", orders.to_human_price(entry_price, mrsn["price_scale"]))
```

To cancel, send `"0x514fcac7" + format(order_id, "064x")` (`cancelOrder(uint256)`) the same way. Method reference: [Python SDK](/developers/sdks/python/#mersennetorders).

## Go

The Go SDK reads everything but has no signing helpers yet: build the calldata, sign with go-ethereum, and submit with `Provider.SendRawTransaction`. Add `github.com/ethereum/go-ethereum` to your module alongside the SDK ([installation](/developers/sdks/go/#installation)).

```go title="main.go"
package main

import (
	"fmt"
	"log"
	"math/big"
	"os"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	mersennet "github.com/mersennet/sdk-go"
)

const precompile = "0x0000000000000000000000000000000000000100"

// ABI words are 32 bytes, left-padded.
func word(v *big.Int) []byte { return common.LeftPadBytes(v.Bytes(), 32) }

func main() {
	// 1. Configure the RPC
	provider := mersennet.NewProvider("https://rpc.mersennet.com")
	orders := mersennet.NewOrders(provider)
	if id, err := provider.ChainID(); err != nil || id != 131071 {
		log.Fatal("not Mersennet testnet")
	}
	key, err := crypto.HexToECDSA(strings.TrimPrefix(os.Getenv("PRIVATE_KEY"), "0x"))
	if err != nil {
		log.Fatal(err)
	}
	from := crypto.PubkeyToAddress(key.PublicKey)

	// Sign a precompile transaction locally, submit it, and wait until the nonce advances (mined).
	send := func(calldata []byte, gas uint64) string {
		nonce, _ := provider.GetNonce(from.Hex())
		gp, _ := provider.GasPrice()
		gasPrice, _ := new(big.Int).SetString(strings.TrimPrefix(gp, "0x"), 16)
		tx := types.NewTransaction(nonce, common.HexToAddress(precompile), big.NewInt(0), gas, gasPrice, calldata)
		signed, err := types.SignTx(tx, types.NewEIP155Signer(big.NewInt(131071)), key)
		if err != nil {
			log.Fatal(err)
		}
		raw, _ := signed.MarshalBinary()
		hash, err := provider.SendRawTransaction(hexutil.Encode(raw))
		if err != nil {
			log.Fatal(err)
		}
		for n, _ := provider.GetNonce(from.Hex()); n <= nonce; n, _ = provider.GetNonce(from.Hex()) {
			time.Sleep(2 * time.Second)
		}
		return hash
	}

	// 2. Read the protocol: switches, margin, units
	protocol, err := orders.GetProtocol()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("settlement active:", protocol["settlementActive"],
		"initial margin bps:", protocol["initialMarginBps"],
		"wei per collateral unit:", protocol["weiPerCollateralUnit"])

	// 3. Read collateral: getCollateral() (selector 0x5c1548fb), from = your address
	perMRSN, _ := orders.CollateralUnitsPerMRSN() // 10^18 before the switch, 1 from it
	raw, _ := provider.Call(map[string]interface{}{"from": from.Hex(), "to": precompile, "data": "0x5c1548fb"})
	unitsNow := new(big.Int).SetBytes(common.FromHex(raw))
	fmt.Println("collateral units:", unitsNow, "units per MRSN:", perMRSN)

	// 4. Deposit 100 MRSN: depositCollateral(uint256 amount), selector 0xbad4a01f
	units, err := orders.ToCollateralUnits("100")
	if err != nil {
		log.Fatal(err)
	}
	send(append(common.FromHex("0xbad4a01f"), word(units)...), 200_000)

	// 5. Place a signed limit order: buy 1 MRSN at $110, GTC
	//    placeOrder(uint64 marketId, bool isBuy, uint256 price, uint256 size, uint8 tif), selector 0x4c570d73
	markets, _ := orders.GetMarkets()
	var mrsn mersennet.Market
	for _, m := range markets {
		if m.Symbol == "MRSN" {
			mrsn = m
		}
	}
	price := mersennet.ToChainPrice(110, mrsn.PriceScale) // 110 at scale 1, 11000 at 100
	calldata := common.FromHex("0x4c570d73")
	for _, w := range []*big.Int{
		new(big.Int).SetUint64(mrsn.ID), big.NewInt(1), // marketId, isBuy = true
		new(big.Int).SetUint64(price), big.NewInt(1), // price, size
		big.NewInt(0), // tif: 0 = GTC, 1 = IOC, 2 = FOK
	} {
		calldata = append(calldata, word(w)...)
	}
	fmt.Println("order tx:", send(calldata, 300_000))

	// 6. Read back: position via getPosition(uint64) (selector 0x0f85fc5a); open orders via the
	//    mersennet_orders_getOpenOrders RPC (no typed Go helper yet — see the curl below)
	raw, _ = provider.Call(map[string]interface{}{
		"from": from.Hex(), "to": precompile,
		"data": "0x0f85fc5a" + hexutil.Encode(word(new(big.Int).SetUint64(mrsn.ID)))[2:],
	})
	if out := common.FromHex(raw); len(out) >= 64 {
		size := new(big.Int).SetBytes(out[:32])
		entry := new(big.Int).SetBytes(out[32:64])
		fmt.Println("position size:", size, "entry price:", mersennet.ToHumanPrice(entry.Uint64(), mrsn.PriceScale))
	}
}
```

To cancel, send `0x514fcac7` + the 32-byte order id (`cancelOrder(uint256)`) the same way. Method reference: [Go SDK](/developers/sdks/go/#orders-reference).

## Read back over plain JSON-RPC

The read methods are ordinary JSON-RPC calls and work from any language or `curl`:

```bash
# Your resting orders
curl -s https://rpc.mersennet.com -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"mersennet_orders_getOpenOrders","params":["0xYourAddress"]}'

# Your margin account: collateral, token collateral, open-order count, positions
curl -s https://rpc.mersennet.com -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"mersennet_orders_getAccount","params":["0xYourAddress"]}'

# The book you traded against (market 1 = MRSN)
curl -s https://rpc.mersennet.com -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"mersennet_orders_getOrderBook","params":["0x1"]}'
```

Fills are on-chain `trade` events: the transaction is on the [explorer](https://explorer.mersennet.com) under your address, and `mersennet_getDomainEvents` or the `MersennetOrdersTrades` WebSocket topic stream them. Full method documentation: [RPC Methods → MersennetOrders](/developers/rpc/methods/#mersennetorders-clob-methods).

## Where to go next

- [Mersennet Trade](/ecosystem/trade/): the terminal over the same precompile — order types, one-click trading with agent keys, points.
- [MersennetOrders architecture](/architecture/order-book/): how matching runs inside consensus.
- [Agent keys and liquidations](/developers/sdks/javascript/#agent-keys-and-liquidations): delegate trading to a second key, run a keeper.
