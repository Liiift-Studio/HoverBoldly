---
name: project-brief
description: Core identity, scope, and constraints for weight-hover
type: project
---

# weight-hover — Project Brief

## Identity
- **Package name**: `weight-hover`
- **Version**: 0.0.1 (pre-release)
- **Author**: Quinn Keaveney / Liiift Studio

## What It Is
On hover, the wght axis increases (heavier/bolder). But heavier characters are wider — normally this reflows the line. Fix: simultaneously decrease wdth or letter-spacing by the exact compensating amount so total advance width stays constant. Pre-calculates width delta on mount. Covers both interactive hover (weight-hover) and static bold-without-shift (bold-shift) modes.

## What It Is Not
- Not a general animation library
- Not a CSS preprocessor
- Not a font loading utility

## API Surface (target)
Options: hoverWeight, normalWeight, mode, prefer, transitionDuration

## Constraints
- Framework-agnostic core (vanilla JS)
- Optional React bindings (peer deps)
- SSR safe (guard typeof window)
- Zero required dependencies (opentype.js optional)
- TypeScript strict mode

## Status
Bootstrap complete. Algorithm not yet implemented.
See PROCESS.md for the build guide.
