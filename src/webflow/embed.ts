// hoverBoldly/src/webflow/embed.ts — zero-config browser bundle for Webflow Custom Code Embed.
// Auto-initialises hoverBoldly on any element marked with [data-hoverboldly], reading options
// from data-* attributes, and exposes a small window.HoverBoldly API for manual control.
import { applyBoldLock } from '../core/adjust'
import type { BoldLockOptions, AxisConfig } from '../core/types'

/** Attribute that opts an element in to the interactive bold-lock effect. */
const OPT_IN_ATTR = 'data-hoverboldly'

/** Valid interaction modes for data-hb-mode. */
const VALID_MODES: readonly string[] = ['element', 'word', 'proximity']

/** Per-element teardown record so destroy() can remove listeners and restore markup/styles. */
interface Instance {
	/** Cleanup closure returned by applyBoldLock — removes listeners and restores the element. */
	cleanup: () => void
}

/** Tracks live instances keyed by their element — WeakMap so removed nodes are GC'd. */
const INSTANCES = new WeakMap<HTMLElement, Instance>()

/** Tracks opted-in elements so restart() can re-scan without a fresh querySelectorAll. */
const TRACKED = new Set<HTMLElement>()

/**
 * Parse a data-* value as a finite number, returning undefined when unset or invalid.
 *
 * @param raw - The raw dataset string (may be undefined)
 */
function num(raw: string | undefined): number | undefined {
	if (raw === undefined) return undefined
	const n = parseFloat(raw)
	return isNaN(n) ? undefined : n
}

/**
 * Read hoverBoldly options from an element's data-* attributes.
 * Unset attributes fall through to the library defaults.
 *
 * Supported attributes:
 *   data-hb-mode                   — element | word | proximity (default 'element')
 *   data-hb-normal-weight          — wght axis value at rest (default computed font-weight)
 *   data-hb-hover-weight           — wght axis value on hover (default 700)
 *   data-hb-transition-duration    — transition duration in ms (default 150)
 *   data-hb-proximity-threshold    — proximity fade distance in px (default 120, proximity mode)
 *   data-hb-resize-observer        — "false" to disable the re-measure ResizeObserver
 *   data-hb-axes                   — JSON map of extra axes, e.g. {"slnt":{"hover":-12}}
 *   data-hb-false-slant-hover-deg  — skewX degrees on hover (enables falseSlant)
 *   data-hb-false-slant-normal-deg — skewX degrees at rest (default 0)
 *
 * @param el - The opted-in element
 */
function readOptions(el: HTMLElement): BoldLockOptions {
	const opts: BoldLockOptions = {}
	const d = el.dataset

	if (d.hbMode && VALID_MODES.includes(d.hbMode)) {
		opts.mode = d.hbMode as BoldLockOptions['mode']
	}
	const normalWeight = num(d.hbNormalWeight)
	if (normalWeight !== undefined) opts.normalWeight = normalWeight
	const hoverWeight = num(d.hbHoverWeight)
	if (hoverWeight !== undefined) opts.hoverWeight = hoverWeight
	const transitionDuration = num(d.hbTransitionDuration)
	if (transitionDuration !== undefined) opts.transitionDuration = transitionDuration
	const proximityThreshold = num(d.hbProximityThreshold)
	if (proximityThreshold !== undefined) opts.proximityThreshold = proximityThreshold
	if (d.hbResizeObserver === 'false') opts.resizeObserver = false

	// Extra variable font axes — supplied as a JSON object of AxisConfig entries.
	if (d.hbAxes) {
		try {
			const parsed = JSON.parse(d.hbAxes) as Record<string, AxisConfig>
			if (parsed && typeof parsed === 'object') opts.axes = parsed
		} catch {
			console.warn('HoverBoldly: Ignoring invalid JSON in data-hb-axes')
		}
	}

	// False slant — enabled by presence of the hover-degree attribute.
	const falseSlantHoverDeg = num(d.hbFalseSlantHoverDeg)
	if (falseSlantHoverDeg !== undefined) {
		opts.falseSlant = { hoverDeg: falseSlantHoverDeg }
		const normalDeg = num(d.hbFalseSlantNormalDeg)
		if (normalDeg !== undefined) opts.falseSlant.normalDeg = normalDeg
	}

	return opts
}

/**
 * Initialise a single element: apply the interactive bold-lock effect and store its teardown.
 * Idempotent — re-initialising an element tears down the previous instance first.
 *
 * @param el - Element to enhance
 */
function initElement(el: HTMLElement): void {
	// Tear down any previous run so re-init doesn't stack listeners or double-wrap markup.
	destroy(el)
	const cleanup = applyBoldLock(el, readOptions(el))
	INSTANCES.set(el, { cleanup })
	TRACKED.add(el)
}

/**
 * Tear down and restore a single element if it has a live instance.
 *
 * @param el - Element previously initialised
 */
function destroy(el: HTMLElement): void {
	const inst = INSTANCES.get(el)
	if (inst) {
		inst.cleanup()
		INSTANCES.delete(el)
	}
	TRACKED.delete(el)
}

/**
 * Scan a root for opted-in elements and initialise each one.
 *
 * @param root - Element or document to search (default: document)
 */
function init(root: ParentNode = document): void {
	root.querySelectorAll<HTMLElement>(`[${OPT_IN_ATTR}]`).forEach(initElement)
}

/**
 * Re-initialise every tracked element, re-reading its current data-* attributes.
 * Useful after content or option attributes change (e.g. Webflow interactions swapping text).
 * initElement tears each element down first, so repeated calls are idempotent.
 */
function restart(): void {
	Array.from(TRACKED).forEach(initElement)
}

/**
 * Auto-initialise once the DOM is parsed and web fonts have loaded.
 * Fonts must settle first: the wght letter-spacing compensation is measured from final
 * glyph metrics, which shift when a web font swaps in.
 */
function autoInit(): void {
	const run = () => {
		if (document.fonts?.ready) {
			document.fonts.ready.then(() => init()).catch(() => init())
		} else {
			init()
		}
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', run, { once: true })
	} else {
		run()
	}
}

autoInit()

// Public browser API — assigned to window.HoverBoldly via the IIFE global name.
export { init, destroy, restart }
