# Hover Boldly

Every browser reflows text when you hover to bold — words push down, lines shift. Bold Lock measures the exact width difference using Canvas `measureText`, then compensates with letter-spacing so the line never moves. One measurement pass on mount; zero reflow on hover.

**[hoverboldly.com](https://hoverboldly.com)** · [npm](https://www.npmjs.com/package/@liiift-studio/hoverboldly) · [GitHub](https://github.com/Liiift-Studio/HoverBoldly)

TypeScript · Canvas measurement · React + Vanilla JS

---

## Install

```bash
npm install @liiift-studio/hoverboldly
```

---

## Usage

### React component

```tsx
import { BoldLockText } from '@liiift-studio/hoverboldly'

<BoldLockText normalWeight={300} hoverWeight={700} transitionDuration={150}>
  Hover over this text...
</BoldLockText>
```

### React hook

```tsx
import { useBoldLock } from '@liiift-studio/hoverboldly'

const ref = useBoldLock({ normalWeight: 300, hoverWeight: 700 })
<p ref={ref}>{children}</p>
```

### Vanilla JS — interactive bold-lock

`applyBoldLock` attaches mouseenter/mouseleave listeners and returns a cleanup function.

```ts
import { applyBoldLock } from '@liiift-studio/hoverboldly'

const el = document.querySelector('p')
const cleanup = applyBoldLock(el, { normalWeight: 300, hoverWeight: 700 })

// Later — remove listeners and reset styles:
cleanup()
```

### Vanilla JS — static bold-shift (CSS `:hover { font-weight: bold }`)

For elements that use CSS `:hover` to apply bold, `applyBoldShift` pre-compensates with letter-spacing so there is no reflow when the style changes.

```ts
import { applyBoldShift } from '@liiift-studio/hoverboldly'

applyBoldShift(el, { normalWeight: 400, boldWeight: 700 })
```

---

## Options

### `BoldLockOptions` (interactive hover)

| Option | Default | Description |
|--------|---------|-------------|
| `normalWeight` | computed `font-weight` | wght axis value at rest |
| `hoverWeight` | `700` | wght axis value on hover |
| `transitionDuration` | `150` | Transition duration in milliseconds |
| `mode` | `'element'` | `'element'` — whole element hovers together. `'word'` — individual word hover |
| `as` | `'p'` | HTML element to render. *(React component only)* |

### `BoldShiftOptions` (static CSS bold)

| Option | Default | Description |
|--------|---------|-------------|
| `normalWeight` | `400` | wght axis value at rest |
| `boldWeight` | `700` | wght axis value when bold |

---

## How it works

In `'element'` mode, Canvas `measureText` reads the element's full text content at both weights once on mount. The width delta is distributed across character gaps as a negative letter-spacing, applied on `mouseenter` and reversed on `mouseleave` — total line width stays identical at both weights.

In `'word'` mode, each word is measured and compensated independently so individual words can hover without affecting their neighbours.

Both modes include touch support (`touchstart`/`touchend`) and keyboard support (`focusin`/`focusout`), so the effect works on mobile and for keyboard navigation. `prefers-reduced-motion: reduce` disables the CSS transition, keeping the weight change instantaneous.

---

## Dev notes

### `next` in root devDependencies

`package.json` at the repo root lists `next` as a devDependency. This is a **Vercel detection workaround** — not a real dependency of the npm package. Vercel's build system inspects the root `package.json` to detect the framework; without `next` present it falls back to a static build and skips the Next.js pipeline, breaking the `/site` subdirectory deploy.

The package itself has zero runtime dependencies. Do not remove this entry.

---

## Future improvements

- **Axis-agnostic mode** — support hovering any variable font axis, not just `wght`; e.g. `hoverAxis: 'wdth'`, `hoverValue: 125`
- **ResizeObserver re-measurement** — re-run compensation when the element's font-size changes on resize (e.g. with responsive `clamp()` typography), so the letter-spacing delta stays accurate at all viewport widths
- **Multi-weight cycles** — hover through a sequence of weights rather than a single toggle (normal → semi-bold → bold → normal)
- **Bold-shift cleanup** — expose a `removeBoldShift(el)` utility to remove the injected `<style>` rule and `data-bold-shift` attribute added by `applyBoldShift`
- **Transition easing** — expose the CSS `transition-timing-function` as an option alongside `transitionDuration`

---

Current version: v1.0.0
