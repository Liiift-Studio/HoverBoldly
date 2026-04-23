// bold-lock/src/core/adjust.ts — framework-agnostic core algorithm

import type { BoldLockOptions, BoldShiftOptions, AxisConfig } from './types'
import { BOLD_LOCK_CLASSES } from './types'

/** WeakMap storing any active ResizeObserver attached to an element by applyBoldLock. */
const boldLockObservers = new WeakMap<HTMLElement, ResizeObserver>()

/**
 * Parse an element's computed fontVariationSettings into a key/value map.
 * Returns an empty object when the value is 'normal' or absent.
 */
export function getFontVariationSettings(el: HTMLElement): Record<string, number> {
	const fvs = getComputedStyle(el).fontVariationSettings
	if (!fvs || fvs === 'normal') return {}
	const result: Record<string, number> = {}
	for (const match of fvs.matchAll(/'([^']+)'\s+([\d.]+)/g)) {
		result[match[1]] = parseFloat(match[2])
	}
	return result
}

/**
 * Measure the rendered text width of an element at the given wght axis value.
 * Uses a shared canvas so the caller can pass one in to avoid repeated allocation.
 */
export function measureAtWeight(el: HTMLElement, wght: number, canvas: HTMLCanvasElement): number {
	const style = getComputedStyle(el)
	const ctx = canvas.getContext('2d')!
	// Use numeric font-weight in the CSS font shorthand — this is valid and Canvas parses it correctly.
	// The previous fvsString approach produced invalid CSS (e.g. "'wght' 700 18px Family") which
	// Canvas silently rejected, causing both weights to measure identically and compensation to be 0.
	ctx.font = `${wght} ${style.fontSize} ${style.fontFamily}`
	return ctx.measureText(el.textContent ?? '').width
}

/**
 * Calculate the compensating letter-spacing (in px) needed to prevent width shift
 * when the element's wght axis moves from normalWeight to boldWeight.
 * Always returns a non-positive number (zero for single-character elements).
 */
export function calcCompensation(
	el: HTMLElement,
	normalWeight: number,
	boldWeight: number,
): number {
	const canvas = document.createElement('canvas')
	const normalWidth = measureAtWeight(el, normalWeight, canvas)
	const boldWidth = measureAtWeight(el, boldWeight, canvas)
	const delta = boldWidth - normalWidth
	const charCount = (el.textContent ?? '').length
	if (charCount === 0) return 0
	if (charCount <= 1) return 0
	// Distribute the width delta across (charCount - 1) inter-character gaps
	return -(delta / (charCount - 1))
}

/**
 * Build the hover font-variation-settings map, merging wght and any extra axes.
 * strength (0–1) interpolates each axis from its rest value to its hover value —
 * used by proximity mode to scale the effect with cursor distance.
 */
function buildHoverFVS(
	currentFvs: Record<string, number>,
	normalWeight: number,
	hoverWeight: number,
	axes?: Record<string, AxisConfig>,
	strength = 1,
): Record<string, number> {
	const result: Record<string, number> = { ...currentFvs }
	result.wght = normalWeight + (hoverWeight - normalWeight) * strength
	if (axes) {
		for (const [tag, config] of Object.entries(axes)) {
			const normalVal = config.normal ?? currentFvs[tag] ?? 0
			result[tag] = normalVal + (config.hover - normalVal) * strength
		}
	}
	return result
}

/**
 * Build the rest font-variation-settings map (strength = 0).
 */
function buildRestFVS(
	currentFvs: Record<string, number>,
	normalWeight: number,
	axes?: Record<string, AxisConfig>,
): Record<string, number> {
	const result: Record<string, number> = { ...currentFvs, wght: normalWeight }
	if (axes) {
		for (const [tag, config] of Object.entries(axes)) {
			result[tag] = config.normal ?? currentFvs[tag] ?? 0
		}
	}
	return result
}

/** Serialise a font-variation-settings map to a CSS string. */
function serializeFVS(fvs: Record<string, number>): string {
	return Object.entries(fvs).map(([k, v]) => `'${k}' ${v}`).join(', ')
}

/**
 * Compute the CSS skewX transform string for a falseSlant config at a given strength.
 * Returns an empty string when the resulting angle is 0 (no transform needed).
 */
function buildSkew(
	falseSlant: { hoverDeg: number; normalDeg?: number } | undefined,
	strength = 1,
): string {
	if (!falseSlant) return ''
	const normalDeg = falseSlant.normalDeg ?? 0
	const deg = normalDeg + (falseSlant.hoverDeg - normalDeg) * strength
	return deg !== 0 ? `skewX(${deg.toFixed(2)}deg)` : ''
}

/**
 * Apply the interactive bold-lock effect to an element.
 * Adds mouseenter/mouseleave listeners and returns a cleanup function.
 */
export function applyBoldLock(
	element: HTMLElement,
	options: BoldLockOptions,
): () => void {
	if (typeof window === 'undefined') return () => {}

	const computedWeight = parseFloat(getComputedStyle(element).fontWeight)
	const normalWeight = options.normalWeight ?? (isNaN(computedWeight) ? 400 : computedWeight)
	const hoverWeight = options.hoverWeight ?? 700
	// Respect prefers-reduced-motion: skip the CSS transition when motion is reduced
	const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
	const duration = prefersReducedMotion ? 0 : (options.transitionDuration ?? 150)
	const currentFvs = getFontVariationSettings(element)

	// --- mode: 'word' — each word is an independent hover target ---
	if (options.mode === 'word') {
		const originalHTML = element.innerHTML

		// Collect all text nodes via recursive childNodes walk
		const textNodes: Text[] = []
		;(function collect(node: Node) {
			if (node.nodeType === Node.TEXT_NODE) textNodes.push(node as Text)
			else node.childNodes.forEach(collect)
		})(element)

		const wordSpans: HTMLElement[] = []

		for (const textNode of textNodes) {
			const text = textNode.textContent ?? ''
			if (!text.trim()) continue
			const tokens = text.split(/(\S+)/)
			const fragment = document.createDocumentFragment()
			for (let i = 0; i < tokens.length; i += 2) {
				const space = tokens[i]
				const word = tokens[i + 1]
				if (!word) continue
				const isLastWord = tokens[i + 3] === undefined
				const trailingSpace = isLastWord ? (tokens[i + 2] ?? '') : ''
				const span = document.createElement('span')
				span.className = BOLD_LOCK_CLASSES.word
				span.appendChild(document.createTextNode(space + word + trailingSpace))
				fragment.appendChild(span)
				wordSpans.push(span)
			}
			textNode.parentNode!.replaceChild(fragment, textNode)
		}

		// Batch all compensation reads before attaching listeners
		const wordData = wordSpans.map((span) => {
			const compPx = calcCompensation(span, normalWeight, hoverWeight)
			const fs = parseFloat(getComputedStyle(span).fontSize)
			const compEm = fs > 0 ? compPx / fs : 0
			return { span, compEm }
		})

		const cleanups: (() => void)[] = []

		for (const { span, compEm } of wordData) {
			const savedTransform = span.style.transform
			const onEnter = () => {
				span.style.fontVariationSettings = serializeFVS(buildHoverFVS(currentFvs, normalWeight, hoverWeight, options.axes))
				span.style.letterSpacing = `${compEm}em`
				const skew = buildSkew(options.falseSlant)
				if (skew) span.style.transform = skew
				const props = ['font-variation-settings', 'letter-spacing']
				if (options.falseSlant) props.push('transform')
				span.style.transition = props.map((p) => `${p} ${duration}ms ease`).join(', ')
			}
			const onLeave = () => {
				span.style.fontVariationSettings = serializeFVS(buildRestFVS(currentFvs, normalWeight, options.axes))
				span.style.letterSpacing = ''
				if (options.falseSlant) span.style.transform = buildSkew(options.falseSlant, 0) || savedTransform
			}
			span.addEventListener('mouseenter', onEnter)
			span.addEventListener('mouseleave', onLeave)
			// Touch support — touchstart activates the word, touchend deactivates it.
			// mouseenter/mouseleave do not fire on iOS/Android touch browsers.
			const onTouchStart = (e: TouchEvent) => { e.preventDefault(); onEnter() }
			const onTouchEnd   = (e: TouchEvent) => { e.preventDefault(); onLeave() }
			span.addEventListener('touchstart', onTouchStart, { passive: false })
			span.addEventListener('touchend',   onTouchEnd,   { passive: false })
			cleanups.push(() => {
				span.removeEventListener('mouseenter', onEnter)
				span.removeEventListener('mouseleave', onLeave)
				span.removeEventListener('touchstart', onTouchStart)
				span.removeEventListener('touchend',   onTouchEnd)
			})
		}

		return () => {
			cleanups.forEach((fn) => fn())
			element.innerHTML = originalHTML
		}
	}

	// --- mode: 'proximity' — per-line weight proportional to cursor distance ---
	if (options.mode === 'proximity') {
		const originalHTML = element.innerHTML
		const threshold = options.proximityThreshold ?? 120

		// Step 1: Walk text nodes, wrap each word in a .wh-word span
		const textNodes: Text[] = []
		;(function collect(node: Node) {
			if (node.nodeType === Node.TEXT_NODE) textNodes.push(node as Text)
			else node.childNodes.forEach(collect)
		})(element)

		const wordSpans: HTMLElement[] = []
		for (const textNode of textNodes) {
			const text = textNode.textContent ?? ''
			if (!text.trim()) continue
			const tokens = text.split(/(\S+)/)
			const fragment = document.createDocumentFragment()
			for (let i = 0; i < tokens.length; i += 2) {
				const space = tokens[i]
				const word = tokens[i + 1]
				if (!word) continue
				const isLastWord = tokens[i + 3] === undefined
				const trailingSpace = isLastWord ? (tokens[i + 2] ?? '') : ''
				const span = document.createElement('span')
				span.className = BOLD_LOCK_CLASSES.word
				span.appendChild(document.createTextNode(space + word + trailingSpace))
				fragment.appendChild(span)
				wordSpans.push(span)
			}
			textNode.parentNode!.replaceChild(fragment, textNode)
		}

		if (wordSpans.length === 0) return () => { element.innerHTML = originalHTML }

		// Step 2: Batch-read BCR.top and group words into visual lines
		const wordTops = wordSpans.map((span) => ({
			span,
			top: Math.round(span.getBoundingClientRect().top),
		}))
		const lineMap = new Map<number, HTMLElement[]>()
		for (const { span, top } of wordTops) {
			if (!lineMap.has(top)) lineMap.set(top, [])
			lineMap.get(top)!.push(span)
		}
		const lineGroups = Array.from(lineMap.entries())
			.sort(([a], [b]) => a - b)
			.map(([, spans]) => spans)

		// Step 3: Rebuild innerHTML with .wh-line spans and <br> separators
		const fragment = document.createDocumentFragment()
		const lineSpans: HTMLElement[] = []

		lineGroups.forEach((group, lineIndex) => {
			const lineSpan = document.createElement('span')
			lineSpan.className = BOLD_LOCK_CLASSES.line
			lineSpan.style.display = 'inline-block'
			lineSpan.style.whiteSpace = 'nowrap'

			// Serialise words with ancestor inline context preserved
			let lineHTML = ''
			for (const wordSpan of group) {
				wordSpan.style.display = ''
				wordSpan.style.whiteSpace = ''
				let html = wordSpan.outerHTML
				let ancestor: Element | null = wordSpan.parentElement
				while (ancestor && ancestor !== element) {
					const shallow = ancestor.cloneNode(false) as Element
					const shallowHTML = shallow.outerHTML
					const split = shallowHTML.lastIndexOf('</')
					html = shallowHTML.slice(0, split) + html + shallowHTML.slice(split)
					ancestor = ancestor.parentElement
				}
				lineHTML += html
			}
			lineSpan.innerHTML = lineHTML
			fragment.appendChild(lineSpan)
			lineSpans.push(lineSpan)

			if (lineIndex < lineGroups.length - 1) {
				const br = document.createElement('br')
				fragment.appendChild(br)
			}
		})

		element.innerHTML = ''
		element.appendChild(fragment)

		// Step 4: Pre-calculate max compensation per line at mount time
		// Compensation is scaled linearly by the weight-change strength in the loop.
		const lineCompensations = lineSpans.map((lineSpan) => {
			const compPx = calcCompensation(lineSpan, normalWeight, hoverWeight)
			const fs = parseFloat(getComputedStyle(lineSpan).fontSize)
			return fs > 0 ? compPx / fs : 0
		})

		// Step 5: Track pointermove to compute per-line weights
		let rafId = 0
		const onPointerMove = (e: PointerEvent) => {
			if (rafId) return // one update per rAF to throttle mousemove
			rafId = requestAnimationFrame(() => {
				rafId = 0
				const cursorY = e.clientY
				lineSpans.forEach((lineSpan, i) => {
					const rect = lineSpan.getBoundingClientRect()
					const lineCenterY = rect.top + rect.height / 2
					const distance = Math.abs(cursorY - lineCenterY)
					const strength = Math.max(0, 1 - distance / threshold)
					lineSpan.style.fontVariationSettings = serializeFVS(
						buildHoverFVS(currentFvs, normalWeight, hoverWeight, options.axes, strength),
					)
					lineSpan.style.letterSpacing = `${(lineCompensations[i] * strength).toFixed(5)}em`
					if (options.falseSlant) {
						const skew = buildSkew(options.falseSlant, strength)
						lineSpan.style.transform = skew || ''
					}
				})
			})
		}

		const onPointerLeave = () => {
			cancelAnimationFrame(rafId)
			rafId = 0
			lineSpans.forEach((lineSpan) => {
				lineSpan.style.fontVariationSettings = serializeFVS(buildRestFVS(currentFvs, normalWeight, options.axes))
				lineSpan.style.letterSpacing = ''
				if (options.falseSlant) lineSpan.style.transform = ''
			})
		}

		element.addEventListener('pointermove', onPointerMove)
		element.addEventListener('pointerleave', onPointerLeave)

		return () => {
			cancelAnimationFrame(rafId)
			element.removeEventListener('pointermove', onPointerMove)
			element.removeEventListener('pointerleave', onPointerLeave)
			element.innerHTML = originalHTML
		}
	}

	// --- mode: 'element' (default) — whole element hovers together ---

	// Pre-calculate compensation at mount time (single DOM read burst)
	const compensationPx = calcCompensation(element, normalWeight, hoverWeight)
	const fontSize = parseFloat(getComputedStyle(element).fontSize)
	const compensationEm = fontSize > 0 ? compensationPx / fontSize : 0
	const savedTransform = element.style.transform

	const onEnter = () => {
		element.style.fontVariationSettings = serializeFVS(buildHoverFVS(currentFvs, normalWeight, hoverWeight, options.axes))
		element.style.letterSpacing = `${compensationEm}em`
		const skew = buildSkew(options.falseSlant)
		if (skew) element.style.transform = skew
		const props = ['font-variation-settings', 'letter-spacing']
		if (options.falseSlant) props.push('transform')
		element.style.transition = props.map((p) => `${p} ${duration}ms ease`).join(', ')
	}

	const onLeave = () => {
		element.style.fontVariationSettings = serializeFVS(buildRestFVS(currentFvs, normalWeight, options.axes))
		element.style.letterSpacing = ''
		if (options.falseSlant) element.style.transform = buildSkew(options.falseSlant, 0) || savedTransform
	}

	element.addEventListener('mouseenter', onEnter)
	element.addEventListener('mouseleave', onLeave)
	// Touch support — touchstart activates the element, touchend deactivates it.
	// mouseenter/mouseleave do not fire on iOS/Android touch browsers.
	const onTouchStart = (e: TouchEvent) => { e.preventDefault(); onEnter() }
	const onTouchEnd   = (e: TouchEvent) => { e.preventDefault(); onLeave() }
	element.addEventListener('touchstart', onTouchStart, { passive: false })
	element.addEventListener('touchend',   onTouchEnd,   { passive: false })
	// Keyboard support — focusin/focusout fire when the element or any descendant
	// (e.g. a link inside the paragraph) gains or loses keyboard focus.
	element.addEventListener('focusin',  onEnter)
	element.addEventListener('focusout', onLeave)

	// Attach a ResizeObserver so compensation stays accurate when font-size changes
	// (e.g. responsive clamp() typography). Default: enabled.
	// Only available in element mode — word and proximity modes rebuild innerHTML on
	// each call anyway, so re-calling applyBoldLock would stack duplicate listeners.
	if (options.resizeObserver !== false && typeof ResizeObserver !== 'undefined') {
		// Disconnect any previous observer on this element before attaching a new one
		boldLockObservers.get(element)?.disconnect()
		// Track element width to detect font-size changes (a font-size change alters
		// computed text width even when layout width is constrained externally).
		let lastOffsetWidth = element.offsetWidth
		// currentCleanup holds the teardown for the currently-active applyBoldLock call.
		// We keep a reference here so the observer can tear down the old call before
		// re-applying — preventing stacked listeners.
		let currentCleanup: (() => void) | null = null
		const ro = new ResizeObserver(() => {
			const newOffsetWidth = element.offsetWidth
			if (newOffsetWidth === lastOffsetWidth) return
			lastOffsetWidth = newOffsetWidth
			// Tear down the previous bold-lock instance (listeners + styles) so we
			// don't stack event listeners on the same element.
			if (currentCleanup) currentCleanup()
			// Re-apply with fresh measurements. Pass resizeObserver: false so the
			// inner call does not create another nested observer.
			currentCleanup = applyBoldLock(element, { ...options, resizeObserver: false })
		})
		ro.observe(element)
		boldLockObservers.set(element, ro)
	}

	// Return a cleanup function that tears down listeners and resets styles
	return () => {
		element.removeEventListener('mouseenter', onEnter)
		element.removeEventListener('mouseleave', onLeave)
		element.removeEventListener('touchstart', onTouchStart)
		element.removeEventListener('touchend',   onTouchEnd)
		element.removeEventListener('focusin',  onEnter)
		element.removeEventListener('focusout', onLeave)
		element.style.fontVariationSettings = ''
		element.style.letterSpacing = ''
		element.style.transition = ''
		element.style.transform = savedTransform
		boldLockObservers.get(element)?.disconnect()
		boldLockObservers.delete(element)
	}
}

/**
 * Apply static bold-shift compensation to an element.
 * Pre-calculates the letter-spacing needed so that CSS :hover { font-weight: bold }
 * does not shift surrounding content. Injects a scoped <style> rule.
 */
export function applyBoldShift(element: HTMLElement, options: BoldShiftOptions = {}): void {
	if (typeof window === 'undefined') return

	const normalWeight = options.normalWeight ?? 400
	const boldWeight = options.boldWeight ?? 700

	const compensationPx = calcCompensation(element, normalWeight, boldWeight)
	const fontSize = parseFloat(getComputedStyle(element).fontSize)
	const compensationEm = fontSize > 0 ? compensationPx / fontSize : 0

	// Assign a stable unique ID so the scoped rule targets only this element
	const id = `bold-shift-${Math.random().toString(36).slice(2, 8)}`
	element.setAttribute('data-bold-shift', id)
	element.dataset.boldShiftCompensation = `${compensationEm}em`

	const style = document.createElement('style')
	style.setAttribute('data-bold-shift', id)
	style.textContent = `[data-bold-shift="${id}"]:hover { letter-spacing: ${compensationEm}em; }`
	document.head.appendChild(style)
}

/**
 * Remove the bold-shift compensation injected by applyBoldShift.
 * Finds the scoped <style> element by the element's data-bold-shift ID, removes it,
 * then strips the data-bold-shift and data-bold-shift-compensation attributes.
 * Safe to call on elements that were never passed to applyBoldShift — no-op in that case.
 */
export function removeBoldShift(element: HTMLElement): void {
	const id = element.getAttribute('data-bold-shift')
	if (!id) return
	// Remove the injected <style> that targets this element's unique ID
	const style = document.head.querySelector(`style[data-bold-shift="${id}"]`)
	if (style) style.remove()
	element.removeAttribute('data-bold-shift')
	delete element.dataset.boldShiftCompensation
}

/**
 * Remove bold-lock markup and restore original HTML.
 * Also disconnects any ResizeObserver attached by applyBoldLock.
 * Kept for backwards compatibility with callers that pass originalHTML.
 */
export function removeBoldLock(element: HTMLElement, originalHTML: string): void {
	boldLockObservers.get(element)?.disconnect()
	boldLockObservers.delete(element)
	element.innerHTML = originalHTML
}

/**
 * Strip any prior bold-lock markup from an element and return clean innerHTML.
 * Safe to call multiple times — idempotent.
 */
export function getCleanHTML(el: HTMLElement): string {
	const clone = el.cloneNode(true) as HTMLElement
	clone.querySelectorAll('[data-bold-lock]').forEach((node) => {
		node.replaceWith(...node.childNodes)
	})
	return clone.innerHTML
}
