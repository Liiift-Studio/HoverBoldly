// Single source of truth for tool colour computation.
// Used by: scripts/sync-sites.mjs (direct import) and shared/lib/toolColors.ts (via import).
// Pure JS — no TypeScript syntax — so Node.js scripts can import it without a build step.
// DO NOT duplicate this logic elsewhere. Update here; run npm run sync to propagate.
//
// METHOD — adaptive farthest-point sampling.
// Each tool is placed at the in-gamut OKLCH colour perceptually farthest (max-min ΔE in OKLab)
// from every tool already placed, so the palette fills the usable colour volume evenly and never
// clusters. The set of usable lightness TIERS grows automatically with the tool count, so the
// minimum perceptual distance stays high as the suite scales (~comfortably distinct to ~24 on two
// tiers, ~80 once the mid tiers switch on). Every tier is contrast-safe: backgrounds darker than
// TEXT_SPLIT get near-white text, lighter ones get dark text. The solve is deterministic and
// memoised, and runs only at sync time to write static CSS — sites never recompute it.

/** All tool IDs in canonical order. Append new tools at the end — earlier tools keep their colour
 *  (farthest-point only ever ADDS the next point; existing assignments never move). */
export const TOOL_IDS = [
	'axisRhythm',
	'fitFlush',
	'fitWidth',
	'floodText',
	'glyphShaper',
	'hoverBoldly',
	'magnetType',
	'opszStepper',
	'opticalMargin',
	'ragtooth',
	'speechType',
	'stabilType',
	'steadyGray',
	'textBreath',
	'typsettle',
	'vfClamp',
	'wrapType',
]

// ── Tunables ───────────────────────────────────────────────────────────────
const TEXT_SPLIT   = 0.55   // background L below this → near-white text; at/above → dark text
const WHITE_C_FRAC = 0.95   // dark / mid-dark backgrounds: push chroma near the gamut max
const WHITE_C_FLOOR= 0.10
const DARK_C_CAP   = 0.13   // light / mid-light backgrounds: cap chroma so they read as tints
const DARK_C_FRAC  = 0.85
const HUE_STEP     = 2      // candidate hue granularity (degrees)
const SEED_L       = 0.28   // deterministic first point — a dark red
const SEED_HUE     = 28

// Usable lightness tiers, added progressively as the tool count grows.
const BASE_DARK    = [0.20, 0.24, 0.28, 0.32]  // always present — white text
const BASE_LIGHT   = [0.835, 0.88, 0.925]      // solve levels — kept stable so the assignment doesn't reshuffle
// Light backgrounds are LIFTED to a lighter display band at render time (more text contrast) without
// changing the solve — so which tool is light/dark and its hue stay fixed. Maps [0.835,0.925] → this.
const LIGHT_DISP_LO = 0.92
const LIGHT_DISP_HI = 0.975
const MID_DARK     = [0.40, 0.46]              // added past MID_DARK_AT — white text (vivid jewel tones)
const MID_LIGHT    = [0.70, 0.76]              // added past MID_LIGHT_AT — dark text
const MID_DARK_AT  = 26
const MID_LIGHT_AT = 44

// Foreground + text-step lightnesses per text mode.
const WHITE_FG = 0.97, WHITE_FG_C = 0.008
const DARK_FG  = 0.26, DARK_FG_C  = 0.055

// ── Colour maths ───────────────────────────────────────────────────────────

/** OKLab → linear sRGB (Björn Ottosson's matrices). */
function oklabToLinearSRGB(L, a, b) {
	const l_ = L + 0.3963377774 * a + 0.2158037573 * b
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b
	const s_ = L - 0.0894841775 * a - 1.2914855480 * b
	const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3
	return [
		+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
	]
}

/** Binary-search the highest chroma that keeps OKLCH(L, C, H) inside the sRGB cube. */
function maxInGamutChroma(L, H) {
	const h = H * Math.PI / 180
	let lo = 0, hi = 0.5
	for (let i = 0; i < 24; i++) {
		const mid = (lo + hi) / 2
		const [r, g, b] = oklabToLinearSRGB(L, mid * Math.cos(h), mid * Math.sin(h))
		const ok = r >= -0.001 && r <= 1.001 && g >= -0.001 && g <= 1.001 && b >= -0.001 && b <= 1.001
		if (ok) lo = mid; else hi = mid
	}
	return lo
}

/** OKLCH (L, C, H°) → OKLab (L, a, b) for perceptual-distance comparison. */
function toLab(L, C, H) {
	const h = H * Math.PI / 180
	return [L, C * Math.cos(h), C * Math.sin(h)]
}

/** Squared Euclidean distance in OKLab (≈ perceptual ΔE²). */
function dist2(p, q) {
	const dL = p[0] - q[0], da = p[1] - q[1], db = p[2] - q[2]
	return dL * dL + da * da + db * db
}

// ── Adaptive farthest-point assignment ─────────────────────────────────────

/** Usable lightness levels for a suite of n tools — tiers switch on as n grows. */
function levelsFor(n) {
	let Ls = [...BASE_DARK, ...BASE_LIGHT]
	if (n > MID_DARK_AT) Ls = Ls.concat(MID_DARK)
	if (n > MID_LIGHT_AT) Ls = Ls.concat(MID_LIGHT)
	return Ls
}

/** One colour candidate at (L, H): chroma + text mode follow the tier the lightness sits in. */
function candidate(L, H) {
	const white = L < TEXT_SPLIT
	const C = white
		? Math.max(WHITE_C_FLOOR, maxInGamutChroma(L, H) * WHITE_C_FRAC)
		: Math.min(DARK_C_CAP, maxInGamutChroma(L, H) * DARK_C_FRAC)
	return { L, C, H, white }
}

let _assignment = null
/** Greedy farthest-point assignment for the current TOOL_IDS (index → colour). Memoised. */
function assignment() {
	if (_assignment) return _assignment
	const N = TOOL_IDS.length
	const Ls = levelsFor(N)
	const cands = []
	for (let H = 0; H < 360; H += HUE_STEP) for (const L of Ls) cands.push(candidate(L, H))
	const labs = cands.map((c) => toLab(c.L, c.C, c.H))
	const chosen = [candidate(SEED_L, SEED_HUE)]
	const chosenLabs = [toLab(chosen[0].L, chosen[0].C, chosen[0].H)]
	while (chosen.length < N) {
		let best = -1, bestMin = -1
		for (let i = 0; i < cands.length; i++) {
			let mn = Infinity
			for (let j = 0; j < chosenLabs.length; j++) {
				const dd = dist2(labs[i], chosenLabs[j])
				if (dd < mn) { mn = dd; if (mn <= bestMin) break }
			}
			if (mn > bestMin) { bestMin = mn; best = i }
		}
		chosen.push(cands[best]); chosenLabs.push(labs[best])
	}
	_assignment = chosen
	return _assignment
}

/** The assigned colour descriptor { L, C, H, white } for a tool, or null if unknown. */
function colorFor(toolId) {
	const i = TOOL_IDS.indexOf(toolId)
	return i < 0 ? null : assignment()[i]
}

/** Format an OKLCH triple as a CSS string. */
function fmt(L, C, H) {
	return `oklch(${(+L).toFixed(3)} ${(+C).toFixed(4)} ${H})`
}

/** Lift a solved light-tier L (in [0.835, 0.925]) into the lighter display band, preserving order. */
function lightDisplayL(L) {
	const t = (L - 0.835) / (0.925 - 0.835)
	return LIGHT_DISP_LO + Math.max(0, Math.min(1, t)) * (LIGHT_DISP_HI - LIGHT_DISP_LO)
}

// ── Exported colour accessors (signatures unchanged) ───────────────────────

/** --background oklch value for a given tool ID. */
export function toolBg(toolId) {
	const c = colorFor(toolId)
	if (!c) return 'oklch(0.10 0.05 0)'
	if (c.white) return fmt(c.L, c.C, c.H)
	// Light card — lift to the lighter display band and recompute in-gamut chroma at the new L.
	const L = lightDisplayL(c.L)
	return fmt(L, Math.min(DARK_C_CAP, maxInGamutChroma(L, c.H) * DARK_C_FRAC), c.H)
}

/** --foreground oklch value — near-white on dark backgrounds, dark on light backgrounds. */
export function toolFg(toolId) {
	const c = colorFor(toolId)
	if (!c) return 'oklch(0.97 0.008 0)'
	return c.white ? fmt(WHITE_FG, WHITE_FG_C, c.H) : fmt(DARK_FG, DARK_FG_C, c.H)
}

/** --btn-bg oklch value — a tinted step away from the background (lighter on dark, darker on light). */
export function toolBtnBg(toolId) {
	const c = colorFor(toolId)
	if (!c) return 'oklch(0.18 0.03 0)'
	if (c.white) {
		const bL = Math.min(0.95, c.L + 0.10)
		return fmt(bL, Math.max(0.03, maxInGamutChroma(bL, c.H) * 0.55), c.H)
	}
	const bL = Math.max(0.15, lightDisplayL(c.L) - 0.14)
	return fmt(bL, Math.min(0.10, maxInGamutChroma(bL, c.H) * 0.70), c.H)
}

/** Secondary text — solid, readable muted step. Replaces opacity-50/60/70 on text. */
export function toolFgMuted(toolId) {
	const c = colorFor(toolId)
	if (!c) return 'oklch(0.78 0.025 0)'
	return c.white ? fmt(0.80, 0.025, c.H) : fmt(0.42, 0.030, c.H)
}

/** Tertiary text — code samples, captions, recessed body. */
export function toolFgSubtle(toolId) {
	const c = colorFor(toolId)
	if (!c) return 'oklch(0.66 0.020 0)'
	return c.white ? fmt(0.68, 0.020, c.H) : fmt(0.52, 0.026, c.H)
}

/** Decorative text — step numerals, hints. Never body copy. */
export function toolFgFaint(toolId) {
	const c = colorFor(toolId)
	if (!c) return 'oklch(0.55 0.016 0)'
	return c.white ? fmt(0.58, 0.016, c.H) : fmt(0.62, 0.022, c.H)
}

// ── Hex helpers — for contexts that can't use oklch() (Satori OG images, favicons) ─────────────

/** sRGB hex for an OKLCH(L, C, H) triple. Clamps to the sRGB gamut. */
export function oklchToHex(L, C, H) {
	const h = H * Math.PI / 180
	const [lr, lg, lb] = oklabToLinearSRGB(L, C * Math.cos(h), C * Math.sin(h))
	const toByte = (c) => {
		const cl = Math.min(1, Math.max(0, c))
		const s = cl <= 0.0031308 ? 12.92 * cl : 1.055 * cl ** (1 / 2.4) - 0.055
		return Math.round(Math.min(1, Math.max(0, s)) * 255)
	}
	return '#' + [lr, lg, lb].map((c) => toByte(c).toString(16).padStart(2, '0')).join('')
}

/** Parse an `oklch(L C H)` string (as produced by the tool* functions) into sRGB hex. */
export function oklchStringToHex(str) {
	const m = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/.exec(str)
	if (!m) return '#000000'
	return oklchToHex(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]))
}

/** Hex shorthands matching the site CSS variables — for OG images and favicons. */
export function toolBgHex(toolId)       { return oklchStringToHex(toolBg(toolId)) }
export function toolFgHex(toolId)       { return oklchStringToHex(toolFg(toolId)) }
export function toolFgMutedHex(toolId)  { return oklchStringToHex(toolFgMuted(toolId)) }
export function toolFgSubtleHex(toolId) { return oklchStringToHex(toolFgSubtle(toolId)) }
export function toolBtnBgHex(toolId)    { return oklchStringToHex(toolBtnBg(toolId)) }
