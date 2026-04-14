# Type Tools Submodule — Claude Instructions

This repo is a git submodule of [`type-tools`](https://github.com/Liiift-Studio/type-tools). It follows a shared site-kit pattern managed from the parent repo.

---

## Synced files — do not edit directly

The files below are **automatically overwritten** by `npm run sync` in the parent repo. Any edits made here will be lost on the next sync.

| File in this repo | Canonical source |
|---|---|
| `site/src/components/ToolDirectory.tsx` | `type-tools/shared/components/ToolDirectory.tsx` |
| `site/src/components/SiteFooter.tsx` | `type-tools/shared/components/SiteFooter.tsx` |
| `site/src/components/CodeBlock.tsx` | `type-tools/shared/components/CodeBlock.tsx` |
| `site/src/app/base.css` | `type-tools/shared/styles/base.css` |
| `site/public/fonts/Merriweather.woff2` | `type-tools/shared/fonts/Merriweather.woff2` |
| `site/public/fonts/Merriweather-Italic.woff2` | `type-tools/shared/fonts/Merriweather-Italic.woff2` |
| `site/public/fonts/inter-300.woff` | `type-tools/shared/fonts/inter-300.woff` |
| `site/next.config.ts` | `type-tools/shared/site/next.config.ts` |
| `site/postcss.config.mjs` | `type-tools/shared/site/postcss.config.mjs` |
| `site/eslint.config.mjs` | `type-tools/shared/site/eslint.config.mjs` |
| `vercel.json` | `type-tools/shared/vercel.json` |
| `.gitignore` | `type-tools/shared/gitignore` |
| `.claude/CLAUDE.md` | `type-tools/shared/claude/CLAUDE.md` |

**To change a synced file:** edit the source in `type-tools/shared/`, then run `npm run sync` from the parent repo root. This copies, commits, and pushes all 16 submodules automatically.

---

## Per-tool files — edit freely

| File | What it controls |
|---|---|
| `site/src/app/globals.css` | `--background`, `--btn-bg`, any tool-specific CSS overrides |
| `site/src/app/layout.tsx` | Page title, description, OG metadata, canonical URL |
| `site/src/app/page.tsx` | Page structure and copy |
| `site/src/components/Demo.tsx` | Interactive demo |
| `site/src/app/opengraph-image.tsx` | OG social image |
| `site/src/app/sitemap.ts` | Sitemap URL |
| `src/**` | npm package source (core algorithm, React hook, component) |

---

## globals.css pattern

Each tool's `globals.css` should contain only per-tool theme vars. Everything else comes from `base.css`:

```css
/* Per-tool theme — base styles live in base.css (synced from type-tools/shared/styles/). */
@import "tailwindcss";
@import "./base.css";

:root {
	--background: hsl(0, 55%, 10%); /* update hue per tool */
	--btn-bg: hsl(0, 35%, 18%);
}
```

Do not add range input styles, scrollbar resets, or font-face declarations here — those live in `base.css`.

---

## Footer pattern

The footer is rendered by `SiteFooter` (synced). In `page.tsx`, import and use it like this:

```tsx
import { version } from "../../../package.json"
import { version as siteVersion } from "../../package.json"
import SiteFooter from "../components/SiteFooter"

// In JSX:
<SiteFooter current="toolId" npmVersion={version} siteVersion={siteVersion} />
```

Do not write a `<footer>` block manually — use `SiteFooter`.

---

## Deploy

Use the `/deploy` skill, or push to the deploy remote directly:

```bash
git push deploy main   # most tools
git push deploy master # magnetType, stabilType
```

Each push to the deploy remote triggers a Vercel production build.
