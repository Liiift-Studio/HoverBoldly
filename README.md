# weight-hover

> Variable font weight hover and bold interactions without layout shift — wght increase with automatic wdth/tracking compensation

## Concept

On hover, the wght axis increases (heavier/bolder). But heavier characters are wider — normally this reflows the line. Fix: simultaneously decrease wdth or letter-spacing by the exact compensating amount so total advance width stays constant. Pre-calculates width delta on mount. Covers both interactive hover (weight-hover) and static bold-without-shift (bold-shift) modes.

## Install

```bash
npm install weight-hover
```

## Usage

### React

```tsx
import { WeightHoverText } from 'weight-hover'

<WeightHoverText>
  Your paragraph text here.
</WeightHoverText>
```

### Vanilla JS

```ts
import { applyWeightHover, getCleanHTML } from 'weight-hover'

const el = document.querySelector('p')
const original = getCleanHTML(el)
applyWeightHover(el, original, { /* options */ })
```

## Options

| Option | Description |
|--------|-------------|
| `hoverWeight` | target wght on hover |
| `normalWeight` | default wght |
| `mode` | 'line' | 'word' | 'element' |
| `prefer` | 'wdth' | 'tracking' | 'auto' |
| `transitionDuration` | ms |

## Development

```bash
npm install
npm test
npm run build
```

---

Part of the [Liiift Studio](https://liiift.studio) typography tools family.
See also: [Ragtooth](https://ragtooth.liiift.studio)
