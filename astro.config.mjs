// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://docs.mersennet.com',
  redirects: {
    '/overview': '/',
    '/architecture/prime-orders': '/architecture/order-book/',
    '/ecosystem/primetrade': '/ecosystem/trade/',
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  integrations: [
    starlight({
      plugins: [starlightLinksValidator()],
      title: 'Mersennet',
      description:
        'Build on Mersennet, an EVM Layer 1 with a native on-chain order book: run a node, trade through the SDKs, and read the protocol and RPC reference.',
      logo: {
        src: './src/assets/logo.svg',
        alt: 'Mersennet',
      },
      favicon: '/favicon.svg',
      head: [
        { tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '48x48' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://docs.mersennet.com/og.jpg' } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://docs.mersennet.com/og.jpg' } },
        { tag: 'meta', attrs: { name: 'twitter:site', content: '@mersennetlabs' } },
      ],
      social: [
        { icon: 'telegram', label: 'Telegram chat', href: 'https://t.me/Mersennet' },
        { icon: 'x.com', label: 'X', href: 'https://x.com/mersennetlabs' },
        { icon: 'github', label: 'GitHub', href: 'https://github.com/mersennet' },
      ],
      lastUpdated: true,
      // No "Edit page" link while the docs repository is private: it would 404 for every reader.
      customCss: ['./src/styles/custom.css', 'katex/dist/katex.min.css'],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { slug: 'getting-started/overview' },
            { slug: 'getting-started/test-the-network' },
            { slug: 'getting-started/network-info' },
            { slug: 'getting-started/wallet-setup' },
            { slug: 'getting-started/faucet' },
            { slug: 'getting-started/first-trade' },
            { slug: 'getting-started/points' },
            { slug: 'getting-started/first-transaction' },
          ],
        },
        {
          label: 'Developers',
          items: [
            {
              label: 'Quick Start',
              items: [
                { slug: 'developers/quick-start/hardhat' },
                { slug: 'developers/quick-start/foundry' },
              ],
            },
            {
              label: 'Tutorials',
              items: [
                { slug: 'developers/tutorials/trade-via-sdk' },
                { slug: 'developers/tutorials/first-private-trade' },
              ],
            },
            {
              label: 'Smart Contracts',
              items: [
                { slug: 'developers/contracts/erc20-guide' },
                { slug: 'developers/contracts/nft-guide' },
                { slug: 'developers/contracts/defi-integration' },
              ],
            },
            {
              label: 'JSON-RPC API',
              items: [
                { slug: 'developers/rpc/overview' },
                { slug: 'developers/rpc/methods' },
                { slug: 'developers/rpc/errors' },
              ],
            },
            {
              label: 'SDKs',
              items: [
                { slug: 'developers/sdks/javascript' },
                { slug: 'developers/sdks/python' },
                { slug: 'developers/sdks/go' },
              ],
            },
            {
              label: 'Privacy & ZK',
              items: [
                { slug: 'developers/privacy/shielded-sdk' },
                { slug: 'developers/privacy/shielded-rpc' },
              ],
            },
          ],
        },
        {
          label: 'Privacy',
          items: [
            { slug: 'privacy/overview' },
            { slug: 'privacy/shielded-accounts' },
            { slug: 'privacy/zk-risk-checks' },
            { slug: 'privacy/selective-disclosure' },
            { slug: 'privacy/note-scanning' },
            { slug: 'privacy/state-proofs' },
            { slug: 'privacy/migration' },
          ],
        },
        {
          label: 'Validators',
          items: [
            { slug: 'validators/overview' },
            { slug: 'validators/run-a-node' },
            { slug: 'validators/become-a-validator' },
            { slug: 'validators/staking' },
            { slug: 'validators/monitoring' },
          ],
        },
        {
          label: 'Architecture',
          items: [
            { slug: 'architecture/consensus' },
            { slug: 'architecture/node-architecture' },
            { slug: 'architecture/evm-compatibility' },
            { slug: 'architecture/order-book' },
            { slug: 'architecture/tokenomics' },
          ],
        },
        {
          label: 'Ecosystem',
          items: [
            { slug: 'ecosystem/trade' },
            { slug: 'ecosystem/maker-vault' },
          ],
        },
        {
          label: 'Resources',
          items: [
            { slug: 'whitepaper' },
            { slug: 'resources/faq' },
            { slug: 'resources/testnet-policies' },
            { slug: 'resources/glossary' },
            { slug: 'resources/contracts' },
            { slug: 'resources/brand-assets' },
            { slug: 'resources/changelog' },
          ],
        },
      ],
    }),
  ],
});
