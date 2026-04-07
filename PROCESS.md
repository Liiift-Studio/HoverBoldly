# Building a Typographic npm Tool — Replication Guide

Extracted from the Ragtooth development history (105 commits, ~3 days, v0.0.1 → v1.2.6).
Use this as the starting playbook for the next tool. Follow the phases in order.

---

## Phase 1 — Concept & Scope

Before writing a line of code, lock in these three things:

**1. The one-sentence problem statement**
Ragtooth: "The browser produces accidental, unrhythmic text rags. This tool shapes them into a deliberate sawtooth."
Your version should be equally specific. Avoid "better typography" — name the exact deficiency.

**2. The algorithm prototype**
Build the core idea in a CodePen or standalone HTML file first. If you can't demonstrate it
in 50 lines of vanilla JS, the scope is too large. Ragtooth started as a CodePen.

**3. The API surface**
Decide: what are the 3–5 knobs? Name them before you build. Renaming later costs commits.
Ragtooth renamed `ragDifference` → `sawDepth` at commit 7. Do the naming upfront.

---

## Phase 2 — Repo Bootstrap

### Structure
```
<toolname>/
├── src/
│   ├── core/
│   │   ├── adjust.ts     ← framework-agnostic algorithm
│   │   ├── resolve.ts    ← unit converter (if needed)
│   │   └── types.ts      ← all types + exported constants
│   ├── react/
│   │   ├── useHook.ts    ← React hook wrapping the core
│   │   └── Component.tsx ← forwardRef component
│   ├── __tests__/        ← Vitest suite
│   └── index.ts          ← public API exports
├── site/                 ← Next.js 16 landing page (separate package)
│   ├── src/app/
│   ├── src/components/Demo.tsx
│   └── public/fonts/     ← local font files (TTF or WOFF — see Pitfalls)
├── demo/                 ← Vite + React playground (optional)
├── package.json          ← root npm package
├── vite.config.ts        ← library-mode build
├── tsconfig.json
├── vercel.json
└── .agent/memory/        ← project context files
```

### package.json (root)
```json
{
  "name": "<toolname>",
  "version": "0.0.1",
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "peerDependencies": {
    "react": ">=17",
    "react-dom": ">=17"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "react-dom": { "optional": true }
  }
}
```

### vite.config.ts
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [react(), dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
      },
    },
  },
})
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "site", "demo"]
}
```

### vercel.json (monorepo)
```json
{
  "buildCommand": "cd site && npm install && npm run build",
  "outputDirectory": "site/.next",
  "framework": "nextjs",
  "installCommand": "cd site && npm install"
}
```

---

## Phase 3 — Core Algorithm

### The Pattern
Every tool in this family follows the same shape:

```
snapshot → reset → read → write → restore scroll
```

1. **Snapshot** — take a clean HTML snapshot of the element on first run
2. **Reset** — `element.innerHTML = originalHTML` at the start of every run (idempotent)
3. **Read** — measure what you need from the DOM (BCR, offsetWidth, etc.) — all reads first
4. **Write** — mutate the DOM — all writes after reads (no interleaving)
5. **Restore scroll** — save `window.scrollY` before step 2, restore via rAF after step 4

### Snapshot helper
```ts
export function getCleanHTML(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement
  // Remove any injected markup from previous runs
  clone.querySelectorAll('[data-tool-word], [data-tool-line]').forEach(n => {
    n.replaceWith(...n.childNodes)
  })
  return clone.innerHTML
}
```

### Scroll restoration — build this in from day one
```ts
// Inside your run() function, BEFORE any DOM mutations:
const scrollY = typeof window !== 'undefined' ? window.scrollY : 0

// ... all DOM mutations here ...

// AFTER mutations:
if (typeof window !== 'undefined') {
  requestAnimationFrame(() => {
    if (Math.abs(window.scrollY - scrollY) > 2) {
      window.scrollTo({ top: scrollY, behavior: 'instant' })
    }
  })
}
```
**Why:** iOS Safari does not support `overflow-anchor: none`. Any DOM mutation that changes
element heights can cause unexpected scroll jumps. The rAF restoration catches all of them.
Do not add this retroactively — it causes race conditions if bolted on in the component layer.

### DOM reading rules
- Use `getBoundingClientRect().width` not `offsetWidth` — subpixel precision
- Batch all reads before any writes — never read after write in the same pass
- Use `white-space: nowrap` on measured elements before reading, remove after
- For space-width probes: give them a DISTINCT CSS class, never reuse the word-span class

### Inline element preservation
Do not use `createTreeWalker` with `NodeFilter.SHOW_TEXT` — it does not descend into
`<em>`, `<strong>`, `<a>` in happy-dom 12 (the test environment). Use recursive childNodes:

```ts
function collectTextNodes(node: Node, result: Text[] = []): Text[] {
  if (node.nodeType === Node.TEXT_NODE) {
    result.push(node as Text)
  } else {
    node.childNodes.forEach(child => collectTextNodes(child, result))
  }
  return result
}
```

---

## Phase 4 — React Bindings

### Hook pattern
```ts
export function useToolName(options: ToolOptions) {
  const ref = useRef<HTMLElement>(null)
  const originalHTMLRef = useRef<string | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const run = useCallback(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return
    if (originalHTMLRef.current === null) {
      originalHTMLRef.current = getCleanHTML(el)
    }
    const scrollY = window.scrollY
    applyTool(el, originalHTMLRef.current, optionsRef.current)
    requestAnimationFrame(() => {
      if (Math.abs(window.scrollY - scrollY) > 2) {
        window.scrollTo({ top: scrollY, behavior: 'instant' })
      }
    })
  }, [])

  useLayoutEffect(() => {
    run()
    // ResizeObserver (width-only)
    let lastWidth = 0
    let rafId = 0
    const ro = new ResizeObserver(entries => {
      const w = Math.round(entries[0].contentRect.width)
      if (w === lastWidth) return
      lastWidth = w
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(run)
    })
    ro.observe(ref.current!)
    return () => { ro.disconnect(); cancelAnimationFrame(rafId) }
  }, [run, /* spread options that should trigger re-run */])

  return ref
}
```

### useDeferredValue for interactive demos
When building the landing page demo with sliders, wrap all rag-driving values in
`useDeferredValue` so the slider UI stays responsive under rapid drag:

```ts
const deferredDepth = useDeferredValue(depth)
const deferredTracking = useDeferredValue(tracking)
// Pass deferred values to RagText/useToolName
// Sliders display and control the non-deferred state
```

### Gyro / device motion coupling
If you add device-motion interaction, keep the motion state SEPARATE from the slider state.
Never write motion output directly into the slider's value state — mobile browsers scroll
to re-rendered controlled inputs.

```ts
const [sliderValue, setSliderValue] = useState(defaultValue)
const [gyroValue, setGyroValue] = useState(defaultValue)
const effectiveValue = gyroMode ? gyroValue : sliderValue
// sliders: value={sliderValue} — never changes during gyro
// algorithm receives: effectiveValue
```

---

## Phase 5 — Test Strategy

### Setup
```ts
// vitest.config.ts
export default defineConfig({
  test: { environment: 'happy-dom' }
})
```

### Mock pattern — DOM measurement
The most important mock is `offsetWidth` / `getBoundingClientRect`. Build this from day one
with separate handling for your "probe" element:

```ts
function mockMeasurement(containerWidth: number, wordWidth: number) {
  const proto = Object.getPrototypeOf(document.createElement('div'))
  Object.defineProperty(proto, 'offsetWidth', {
    configurable: true,
    get: function(this: HTMLElement) {
      if (this.classList?.contains(PROBE_CLASS)) return 0   // ← critical
      if (this.classList?.contains(WORD_CLASS)) return wordWidth
      return containerWidth
    }
  })
  Element.prototype.getBoundingClientRect = function(this: Element) {
    const el = this as HTMLElement
    if (el.classList?.contains(PROBE_CLASS)) return { width: 0 } as DOMRect
    const w = el.classList?.contains(WORD_CLASS) ? wordWidth : containerWidth
    return { width: w } as DOMRect
  }
}
```

**Why the probe matters:** If your space-width probe shares a CSS class with word spans,
the mock returns wordWidth for both. `effectiveWidth = lineWidth - spaceWidth` collapses
to 0 at every line start. Every word becomes its own "line". All line-break tests fail.
Give the probe a distinct class and return 0 for it.

### Test coverage targets
- Core algorithm passes (reset, word-wrap, line-grouping, output)
- Unit converter (all units: px, %, em, rem, ch)
- Inline element preservation (em, strong, a)
- Edge cases: empty string, single word, orphan spaces, NaN inputs
- getCleanHTML idempotence (run twice, same output)
- SSR safety (guard typeof window)

---

## Phase 6 — Landing Site

### Stack
- Next.js 16 (App Router, static export compatible)
- Tailwind CSS 4
- Merriweather variable font (or another editorial-quality variable font)
- `useDeferredValue` on all demo props

### Font loading
Download fonts locally into `site/public/fonts/`. Do NOT fetch from a CDN at build time.
Satori (used for OG image generation) requires local TTF or WOFF files — not WOFF2,
not variable fonts. Download a static WOFF file from jsDelivr/fontsource at setup time.

```
site/public/fonts/
├── merriweather-variable.ttf   ← for the site (variable, all axes)
├── merriweather-300.woff       ← for OG image (Satori: WOFF only, not WOFF2)
└── merriweather-300.ttf        ← fallback OG
```

### OG image (`site/src/app/opengraph-image.tsx`)
```ts
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Load font at build time from local file — never from CDN
const font = await readFile(join(process.cwd(), 'public/fonts/inter-300.woff'))

export default async function OGImage() {
  return new ImageResponse(/* JSX */, {
    width: 1200, height: 630,
    fonts: [{ name: 'Inter', data: font, weight: 300, style: 'normal' }]
  })
}
```

### Demo component requirements
- Sliders for every exposed option
- `aria-label` on every `<input type="range">` from day one
- `touch-action: none` on every range input (prevents mobile scroll-during-drag)
- `@media (pointer: coarse)` thumb size: 28px, `margin-block: 10px`
- All opacity values ≥ 0.50 for 4.5:1 contrast on dark backgrounds

### Contrast reference (dark purple bg ~#160927)
| Tailwind class | Approx contrast | WCAG AA (small text) |
|---|---|---|
| opacity-30 | ~2.4:1 | Fail |
| opacity-40 | ~3.4:1 | Fail |
| opacity-50 | ~4.2:1 | Fail |
| opacity-55 | ~4.7:1 | Pass |
| opacity-60 | ~5.2:1 | Pass |

Use opacity-60 as the minimum for any text that needs to pass. Use opacity-50 only for
decorative/non-essential elements that can be excluded from accessibility requirements.

---

## Phase 7 — Accessibility Checklist

Before v1.0.0:
- [ ] All `<input>` elements have `aria-label` or associated `<label>`
- [ ] All text meets 4.5:1 contrast (12px normal) or 3:1 (large text ≥18px or 14px bold)
- [ ] All interactive elements have `:focus-visible` styles
- [ ] Touch targets ≥ 44px on `pointer: coarse` devices
- [ ] No keyboard traps

---

## Phase 8 — Deploy Setup

### Git remotes
```bash
git remote add origin  git@github.com:quitequinn/<repo>.git
git remote add deploy  git@github-liiift:Liiift-Studio/<repo>.git
```

### Version bump commit (triggers Vercel)
```bash
# Edit package.json version manually, then:
git -c user.name="Liiift" -c user.email="hello@liiift.studio" commit -m "v{new_version}"
git push deploy main
git push origin main
```

### npm publish
```bash
npm run build
npm publish --access public
```

---

## Known Pitfalls (do these correctly the first time)

| Pitfall | What went wrong in Ragtooth | Correct approach |
|---|---|---|
| **OG font** | Variable font → WOFF2 → CDN fetch → eventually local WOFF | Download a static WOFF to `public/fonts/` before writing `opengraph-image.tsx` |
| **Space probe class** | Probe used same class as word spans → mocks returned wordWidth for probe → effectiveWidth=0 | Define a distinct `PROBE_CLASS` constant; return 0 for it in all mocks |
| **TreeWalker in tests** | `SHOW_TEXT` TreeWalker skips `<em>`/`<strong>` in happy-dom 12 | Use recursive `childNodes` traversal from day one |
| **Scroll restoration** | Added `overflow-anchor: none` (no iOS Safari support), then added a racy Demo-level effect | Put `requestAnimationFrame` save/restore inside `run()` from day one |
| **Gyro ↔ slider state** | Gyro wrote to slider state → controlled input `value` changed → mobile scroll-to-input | Keep motion state separate from slider state (see Phase 4) |
| **Syntax highlighter** | Brought in `sugar-high`, then replaced with custom tokenizer | Write a minimal custom tokenizer; avoid syntax highlighter dependencies |
| **React peer deps** | Initially required React → blocked vanilla JS users | Mark react/react-dom as `peerDependenciesMeta.optional: true` from day one |
| **Contrast ratios** | Several `opacity-40` elements failed Lighthouse → iterated | Use opacity-60 minimum for small text; audit with Lighthouse before v1.0.0 |
| **`window` in SSR** | Initial algorithm assumed `window` exists | Guard every `window`/`document` access with `typeof window !== 'undefined'` |

---

## Phase Sequence Summary

```
1. Concept — one sentence, CodePen prototype, API names locked
2. Bootstrap — monorepo, vite lib config, tsconfig strict, .agent/ init
3. Core algorithm — snapshot/reset/read/write/scroll-restore pattern
4. Bindings — React hook + component (useDeferredValue, optional peer deps)
5. Tests — happy-dom, mock pattern with distinct probe class, inline elements
6. Site — Next.js, local fonts, demo with aria-labels and contrast
7. Accessibility — Lighthouse ≥ 95 before v1.0.0
8. Deploy — dual remotes, version bump as Liiift, npm publish
```

Total time from bootstrap to v1.0.0: aim for ~2 days if concept is clear.
