# Hover Boldly

Variable font weight hover — increase `wght` on interaction without layout shift. Measures the width difference and applies letter-spacing compensation so the surrounding text never moves.

**[hoverboldly.com](https://hoverboldly.com)** · [npm](https://www.npmjs.com/package/@liiift-studio/hoverboldly) · [GitHub](https://github.com/Liiift-Studio/HoverBoldly)

---

## Install

```bash
npm install @liiift-studio/hoverboldly
```

---

## Usage

### React component (interactive hover)

```tsx
import { BoldLockText } from '@liiift-studio/hoverboldly'

<BoldLockText hoverWeight={700} normalWeight={400} transitionDuration={150}>
  Hover over this text
</BoldLockText>
```

### React hook

```tsx
import { useBoldLock } from '@liiift-studio/hoverboldly'

function NavLink({ children }) {
  const ref = useBoldLock({ hoverWeight: 700, transitionDuration: 120 })
  return <a ref={ref}>{children}</a>
}
```

### Vanilla JS — interactive bold-lock

```ts
import { applyBoldLock, removeBoldLock, getCleanHTML } from '@liiift-studio/hoverboldly'

const el = document.querySelector('a')
const originalHTML = getCleanHTML(el)

applyBoldLock(el, originalHTML, { hoverWeight: 700 })
```

### Vanilla JS — static bold-shift (CSS `:hover { font-weight: bold }`)

```ts
import { applyBoldShift } from '@liiift-studio/hoverboldly'

// Pre-compensates for the bold width difference via letter-spacing
applyBoldShift(el, { normalWeight: 400, boldWeight: 700 })
```

---

## Options

### `BoldLockOptions` (interactive hover)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `normalWeight` | `number` | computed `font-weight` | wght axis value at rest |
| `hoverWeight` | `number` | `700` | wght axis value on hover |
| `transitionDuration` | `number` | `150` | Transition duration in milliseconds |
| `mode` | `'element' \| 'word'` | `'element'` | Compensation mode — `'element'` compensates the full element; `'word'` compensates each word independently |

### `BoldShiftOptions` (static CSS bold)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `normalWeight` | `number` | `400` | wght axis value at rest |
| `boldWeight` | `number` | `700` | wght axis value when bold |

---

## Dev notes

### `next` in root devDependencies

`package.json` at the repo root lists `next` as a devDependency. This is a **Vercel detection workaround** — not a real dependency of the npm package. Vercel's build system inspects the root `package.json` to detect the framework; without `next` present it falls back to a static build and skips the Next.js pipeline, breaking the `/site` subdirectory deploy.

The package itself has zero runtime dependencies. Do not remove this entry.

---

Current version: v1.0.0
