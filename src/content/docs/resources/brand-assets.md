---
title: "Brand Assets"
---

Brand guidelines for Mersennet: colors, typography, logo usage, and downloadable assets for developers, partners, and community members.

## Logo

The Mersennet mark is the letter **M drawn as five vertical bars**, anchored to a
common top line. Five binary ones (`11111₂` = 31 = 2⁵−1) form a Mersenne
prime: the name is written into the mark in binary. The mark is set in
phosphor green (`#7dff9b`) on black.

<img src="/logo.svg" alt="Mersennet mark" width="96" height="96" />

Download: [logo.svg](/logo.svg) · [favicon.svg](/favicon.svg) · [social card](/mersennet-social.svg)

A complete kit lives in
[`brand/` in the monorepo](https://github.com/mersennet/mersennet/tree/main/brand):
avatars, banners for every platform (X, LinkedIn, YouTube,
Discord, Facebook, GitHub), post templates, and transparent renders.

### Guidelines

- The five bars are always **top-anchored and symmetric** (heights 5·2·3·2·5). Never bottom-anchor them: that reads as an audio equalizer, not the M.
- Use phosphor green `#7dff9b` on dark backgrounds and deep green `#0c8f43` on light backgrounds.
- Maintain clear space around the mark equal to one bar width.
- Do not stretch, rotate, re-space, or re-proportion the bars.
- For monochrome contexts the mark may be set in pure white or pure black.

### Don'ts

- Do not change the number of bars: five is the point (11111₂ = 31).
- Do not apply gradients, shadows, or outlines.
- Do not place the mark on busy or low-contrast backgrounds.
- Do not round the bars into circles or taper them.

## Color Palette

### Primary Brand Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Phosphor Green** | `#7dff9b` | 125, 255, 155 | Primary brand color, logo, CTAs, accents on dark |
| **Deep Green** | `#0c8f43` | 12, 143, 67 | Logo and accents on light backgrounds |
| **Teal** | `#40e0b4` | 64, 224, 180 | Secondary accent (charts, glows) |

### Background Colors (Dark Theme)

| Name | Hex | Usage |
|------|-----|-------|
| **Base** | `#000000` | Page background, navbar, footer |
| **Surface** | `#0a0c0b` | Content area background |
| **Elevated** | `#101512` | Cards, panels, elevated surfaces |

### Supporting Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#3fe57f` | Success states, confirmations |
| **Warning** | `#f59e0b` | Warnings, "Coming Soon" badges |
| **Danger** | `#ef4444` | Errors, destructive actions |
| **Text Primary** | `#e8edf5` | Primary text on dark backgrounds |
| **Text Secondary** | `#94a3b8` | Subtitles, descriptions, muted text |

### No Gradients

The Mersennet brand is deliberately flat: **no gradients, no shadows, no outlines** on the mark or brand surfaces. Phosphor green on black is the look. If you need visual hierarchy, vary opacity of the phosphor green (e.g. `rgba(125, 255, 155, 0.15)` for subtle fills) rather than introducing a second hue.

## Typography

### UI / Headings

- **Font:** Schibsted Grotesk
- **Source:** [Google Fonts](https://fonts.google.com/specimen/Schibsted+Grotesk)
- **Usage:** Headings, navigation, body text, buttons
- **Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extra-bold)

The **wordmark** is always JetBrains Mono Bold, all caps, with 0.14em tracking.

### Code / Monospace

- **Font:** JetBrains Mono
- **Source:** [Google Fonts](https://fonts.google.com/specimen/JetBrains+Mono)
- **Usage:** Code blocks, addresses, chain IDs, technical content
- **Weight:** 400 (regular), 500 (medium), 600 (semibold)

### CSS Variables

```css
:root {
  --mersennet-accent: #7dff9b;
  --mersennet-accent-dim: rgba(125, 255, 155, 0.15);
  --mersennet-accent-subtle: rgba(125, 255, 155, 0.08);
  --mersennet-deep-green: #0c8f43;
  --mersennet-teal: #40e0b4;
  --mersennet-bg-base: #000000;
  --mersennet-bg-surface: #0a0c0b;
  --mersennet-bg-elevated: #101512;
  --mersennet-font-ui: 'Schibsted Grotesk', system-ui, -apple-system, sans-serif;
  --mersennet-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

## Downloadable Assets

| Asset | Format | Description |
|-------|--------|-------------|
| Logo (mark) | SVG | Five-bar M mark in phosphor green (white, black, and deep-green variants in the kit) |
| Favicon | SVG | Mark on a rounded black tile |
| Social Card | SVG/PNG | Open Graph / Twitter share image (1200×630) |

:::tip
The full media kit (vector masters, transparent PNG renders, and platform-exact social sizes) lives in [`brand/` in the monorepo](https://github.com/mersennet/mersennet/tree/main/brand).
:::

## Integration Guide

When building dApps or documentation for Mersennet:

1. Use **Phosphor Green (`#7dff9b`)** for primary actions, links, active states, and accent highlights on dark backgrounds (deep green `#0c8f43` on light ones).
2. Keep surfaces flat — no gradients or shadows on brand elements.
3. Use **Schibsted Grotesk** for UI text and **JetBrains Mono** for code, addresses, and technical content.
4. Prefer black backgrounds (`#000` base) for a consistent Mersennet look.
5. Import fonts via Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

## Contact

For custom brand requests, partnerships, or asset access, reach out via the [Mersennet GitHub](https://github.com/mersennet/mersennet) or community channels.
