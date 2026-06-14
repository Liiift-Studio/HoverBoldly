// Single source of truth for tool colour computation.
// Used by: scripts/sync-sites.mjs (direct import) and shared/lib/toolColors.ts (via import).
// Pure JS — no TypeScript syntax — so Node.js scripts can import it without a build step.
// DO NOT duplicate this logic elsewhere. Update here; run npm run sync to propagate.

/** All tool IDs in canonical order. Append new tools at the end — existing hues stay stable. */
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

const GOLDEN_ANGLE = 137.508

// Progressive tier thresholds — append tools freely, system adapts automatically.
const TIER_1_MAX = 6   // ≤6 tools: flat, one saturation level
const TIER_2_MAX = 24  // 7–24 tools: vivid/clay alternation (even = vivid, odd = clay)
// >24 tools (Tier 3): 4 buckets — dark-vivid, dark-clay, light-vivid, light-pastel

// Tier 1 — flat
const T1_L_BG   = 0.14
const T1_L_BTN  = 0.21
const T1_FRAC   = 0.88

// Tier 2 vivid (even-index tools)
const T2V_L_BG   = 0.17
const T2V_L_BTN  = 0.24
const T2V_FRAC   = 0.85
const T2V_FLOOR  = 0.08

// Tier 2 clay (odd-index tools)
const T2C_L_BG   = 0.12
const T2C_L_BTN  = 0.19
const T2C_FRAC   = 0.38
const T2C_FLOOR  = 0.04

// Tier 3 light-vivid (bucket 2)
const T3LV_L_BG  = 0.88
const T3LV_L_BTN = 0.82
const T3LV_FRAC  = 0.85
const T3LV_FLOOR = 0.08

// Tier 3 light-pastel (bucket 3)
const T3LP_L_BG  = 0.93
const T3LP_L_BTN = 0.87
const T3LP_C_BG  = 0.06
const T3LP_C_BTN = 0.04

function hueForIndex(index) {
	return Math.round((index * GOLDEN_ANGLE) % 360)
}

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

function tier(n) {
	if (n <= TIER_1_MAX) return 1
	if (n <= TIER_2_MAX) return 2
	return 3
}

/** --background oklch value for a given tool ID. */
export function toolBg(toolId) {
	const index = TOOL_IDS.indexOf(toolId)
	if (index < 0) return 'oklch(0.10 0.05 0)'
	const H = hueForIndex(index)
	const t = tier(TOOL_IDS.length)
	if (t === 1) {
		const C = Math.max(0.03, maxInGamutChroma(T1_L_BG, H) * T1_FRAC).toFixed(4)
		return `oklch(${T1_L_BG} ${C} ${H})`
	}
	if (t === 2) {
		if (index % 2 === 0) {
			const C = Math.max(T2V_FLOOR, maxInGamutChroma(T2V_L_BG, H) * T2V_FRAC).toFixed(4)
			return `oklch(${T2V_L_BG} ${C} ${H})`
		}
		const C = Math.max(T2C_FLOOR, maxInGamutChroma(T2C_L_BG, H) * T2C_FRAC).toFixed(4)
		return `oklch(${T2C_L_BG} ${C} ${H})`
	}
	const bucket = index % 4
	if (bucket === 0) {
		const C = Math.max(T2V_FLOOR, maxInGamutChroma(T2V_L_BG, H) * T2V_FRAC).toFixed(4)
		return `oklch(${T2V_L_BG} ${C} ${H})`
	}
	if (bucket === 1) {
		const C = Math.max(T2C_FLOOR, maxInGamutChroma(T2C_L_BG, H) * T2C_FRAC).toFixed(4)
		return `oklch(${T2C_L_BG} ${C} ${H})`
	}
	if (bucket === 2) {
		const C = Math.max(T3LV_FLOOR, maxInGamutChroma(T3LV_L_BG, H) * T3LV_FRAC).toFixed(4)
		return `oklch(${T3LV_L_BG} ${C} ${H})`
	}
	return `oklch(${T3LP_L_BG} ${T3LP_C_BG} ${H})`
}

/** --btn-bg oklch value for a given tool ID. */
export function toolBtnBg(toolId) {
	const index = TOOL_IDS.indexOf(toolId)
	if (index < 0) return 'oklch(0.18 0.03 0)'
	const H = hueForIndex(index)
	const t = tier(TOOL_IDS.length)
	if (t === 1) {
		const C = Math.max(0.02, maxInGamutChroma(T1_L_BTN, H) * T1_FRAC * 0.5).toFixed(4)
		return `oklch(${T1_L_BTN} ${C} ${H})`
	}
	if (t === 2) {
		if (index % 2 === 0) {
			const C = Math.max(T2V_FLOOR * 0.6, maxInGamutChroma(T2V_L_BTN, H) * 0.45).toFixed(4)
			return `oklch(${T2V_L_BTN} ${C} ${H})`
		}
		const C = Math.max(T2C_FLOOR * 0.6, maxInGamutChroma(T2C_L_BTN, H) * T2C_FRAC * 0.6).toFixed(4)
		return `oklch(${T2C_L_BTN} ${C} ${H})`
	}
	const bucket = index % 4
	if (bucket === 0) {
		const C = Math.max(T2V_FLOOR * 0.6, maxInGamutChroma(T2V_L_BTN, H) * 0.45).toFixed(4)
		return `oklch(${T2V_L_BTN} ${C} ${H})`
	}
	if (bucket === 1) {
		const C = Math.max(T2C_FLOOR * 0.6, maxInGamutChroma(T2C_L_BTN, H) * T2C_FRAC * 0.6).toFixed(4)
		return `oklch(${T2C_L_BTN} ${C} ${H})`
	}
	if (bucket === 2) {
		const C = Math.max(T3LV_FLOOR * 0.6, maxInGamutChroma(T3LV_L_BTN, H) * 0.55).toFixed(4)
		return `oklch(${T3LV_L_BTN} ${C} ${H})`
	}
	return `oklch(${T3LP_L_BTN} ${T3LP_C_BTN} ${H})`
}

/** --foreground oklch value for a given tool ID — dark for light backgrounds, light for dark. */
export function toolFg(toolId) {
	const index = TOOL_IDS.indexOf(toolId)
	if (index < 0) return 'oklch(0.93 0.03 0)'
	const H = hueForIndex(index)
	const t = tier(TOOL_IDS.length)
	if (t === 3 && index % 4 >= 2) return `oklch(0.15 0.06 ${H})`
	return `oklch(0.93 0.03 ${H})`
}

/** Whether the foreground is dark (tier-3 light-background tools). Muted steps move toward the bg. */
function fgIsDark(index) {
	return tier(TOOL_IDS.length) === 3 && index % 4 >= 2
}

/** Secondary text — solid, readable muted step. Replaces opacity-50/60/70 on text. */
export function toolFgMuted(toolId) {
	const index = TOOL_IDS.indexOf(toolId)
	if (index < 0) return 'oklch(0.78 0.025 0)'
	const H = hueForIndex(index)
	return fgIsDark(index) ? `oklch(0.34 0.022 ${H})` : `oklch(0.78 0.025 ${H})`
}

/** Tertiary text — code samples, captions, recessed body. */
export function toolFgSubtle(toolId) {
	const index = TOOL_IDS.indexOf(toolId)
	if (index < 0) return 'oklch(0.66 0.020 0)'
	const H = hueForIndex(index)
	return fgIsDark(index) ? `oklch(0.46 0.018 ${H})` : `oklch(0.66 0.020 ${H})`
}

/** Decorative text — step numerals, hints. Never body copy. */
export function toolFgFaint(toolId) {
	const index = TOOL_IDS.indexOf(toolId)
	if (index < 0) return 'oklch(0.55 0.016 0)'
	const H = hueForIndex(index)
	return fgIsDark(index) ? `oklch(0.58 0.014 ${H})` : `oklch(0.55 0.016 ${H})`
}
