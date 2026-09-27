---
title: "Testnet Policies"
description: "What the Mersennet public testnet promises and what it does not: value of testnet assets, points, resets, upgrades, data retention, rate limits, support and incident communication."
---

The Mersennet testnet is a public network run for testing. This page states plainly what you can rely on and what you cannot. It applies to everything under `mersennet.com` — the chain, `trade.mersennet.com`, the faucet, the explorer and the docs — and complements the terminal's [Terms of Use](https://trade.mersennet.com/terms) and [Risk Disclosure](https://trade.mersennet.com/risk).

## Testnet assets have no value

Testnet MRSN, the mock stablecoins, every balance, position, order, vault share and staking bond exist only to exercise the software. They cannot be bought, sold or redeemed, and nobody at Mersennet will ever ask you to pay for them. Anyone offering to sell testnet MRSN is running a scam.

## Points

Points on the [points page](https://trade.mersennet.com/points) record participation: trading volume, running a verified node, referrals, the weekly sprint and Maker Vault deposits. They are a scoreboard, not an asset:

- They have no monetary value and are not a token, security or claim of any kind.
- They carry **no promise of a future token, allocation, airdrop or payment**. Any future program will be announced on its own terms; nothing on this network implies one.
- Accrual rules can change between seasons, a season can be paused, and totals can be recalculated if a bug or an abuse is found.
- Points earned through wash trading, self-dealing across wallets, faucet or referral farming, exploits, or automation misrepresenting itself as human use are forfeited, and the wallets involved may be excluded.

## Resets

The chain **may be reset** — a new genesis, all balances and history gone. Resets are used only when the alternative is carrying a defect forward; there have been two (July and August 2026, both for feature releases that changed genesis — see the [changelog](/resources/changelog/)). A reset is announced at least 48 hours ahead on the [Telegram group](https://t.me/Mersennet), the [announcement bar](https://trade.mersennet.com) and this changelog, together with what happens to points (the default is that points survive a reset; balances do not). Node operators re-run the installer; keys and operator settings are kept.

## Protocol upgrades

Consensus changes activate at announced block heights, listed with live time estimates on the [upgrades page](https://explorer.mersennet.com/upgrades) and in the staking page's schedule. Validators must run the current release before each height — a node on an old build forks off at the switch and is jailed. Releases are signed; the installer refuses unsigned bundles. Nothing is required from traders at an upgrade.

## Rate limits

| Surface | Limit |
|---|---|
| Faucet | 1 drip (1,001 MRSN) per address per hour; at most 3 drips per connection (IP) per day; 1 mock-token claim per token per address per hour |
| Public RPC (`rpc.mersennet.com`) | Fair use behind Cloudflare; `admin_*`, `debug_*`, `miner_*`, `personal_*` are not exposed; `eth_getLogs` spans up to 2,000 blocks per call. Heavy users should [run their own node](/validators/run-a-node/) — it is in sync in about a minute |
| Trade API | 600 requests per minute per IP; 60 per minute on sensitive endpoints (keys, agents, alerts, auth) |

Limits protect the network for everyone and may be tightened during abuse without notice.

## Data and privacy

The chain is public: every transaction, order and balance is visible to anyone, forever (until a reset). The terminal and API store what they need to serve you — your address, orders you armed in the browser (stop, TWAP), referral links, points, feedback you submit — and the origin IP for rate limiting. No accounts, no e-mail, no tracking cookies; see the terminal's [Privacy Policy](https://trade.mersennet.com/privacy). Shielded (private) features are not active on this testnet yet; nothing you do here is private.

## Availability, incidents and support

There is no uptime guarantee. What you can rely on:

- **Status**: [status.mersennet.com](https://status.mersennet.com/status/mersennet) checks the chain, RPC, terminal, API, explorer, faucet, snapshots and the exchange's liveness every minute; the team is paged on red.
- **Incidents** are written up in the [changelog](/resources/changelog/) with cause, effect and fix — for example the 20–25 September exchange pause.
- **Support**: questions in the [Telegram group](https://t.me/Mersennet); bugs and product feedback through the [feedback form](https://trade.mersennet.com/feedback) (it reaches the team within minutes); security issues to **security@mersennet.com** — never in public, see the [FAQ](/resources/faq/#security).
- **Node operators**: the staking page and `mersennet-check` tell you when your build is behind; the installer upgrades in one command and keeps your keys.

## Known limitations

- Shielded accounts, notes and private orders are described in the docs but switch on at the privacy hard fork; today the shielded root is anchored in every block and nothing else.
- Preview pages in the terminal (spot, options, OTC, copy trading and others) are roadmap mock-ups and say so in a banner; they are not connected to the chain.
- Validators run on modest hosts; a validator that runs out of memory restarts itself gracefully (a few seconds off the leader rotation) until the next release sizes the state cache.
- The testnet is not the mainnet: mainnet starts from its own genesis, and nothing here carries over unless a program says so explicitly.

## Open source

The node ([`mersennet/mersennet`](https://github.com/mersennet/mersennet)) and the terminal ([`mersennet/trade`](https://github.com/mersennet/trade)) are source-available under the Business Source License 1.1 (Apache-2.0 from 2030); the explorer, SDKs, website, faucet and these docs are MIT. Contributions to the node and terminal need the CLA in each repository.
