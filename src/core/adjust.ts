// bold-lock/src/core/adjust.ts — framework-agnostic core algorithm

import type { BoldLockOptions, BoldShiftOptions } from './types'
import { BOLD_LOCK_CLASSES } from './types'

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
	const duration = options.transitionDuration ?? 150
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
			const onEnter = () => {
				const newFvs = { ...currentFvs, wght: hoverWeight }
				span.style.fontVariationSettings = Object.entries(newFvs).map(([k, v]) => `'${k}' ${v}`).join(', ')
				span.style.letterSpacing = `${compEm}em`
				span.style.transition = `font-variation-settings ${duration}ms ease, letter-spacing ${duration}ms ease`
			}
			const onLeave = () => {
				const newFvs = { ...currentFvs, wght: normalWeight }
				span.style.fontVariationSettings = Object.entries(newFvs).map(([k, v]) => `'${k}' ${v}`).join(', ')
				span.style.letterSpacing = ''
			}
			span.addEventListener('mouseenter', onEnter)
			span.addEventListener('mouseleave', onLeave)
			cleanups.push(() => {
				span.removeEventListener('mouseenter', onEnter)
				span.removeEventListener('mouseleave', onLeave)
			})
		}

		return () => {
			cleanups.forEach((fn) => fn())
			element.innerHTML = originalHTML
		}
	}

	// --- mode: 'element' (default) — whole element hovers together ---

	// Pre-calculate compensation at mount time (single DOM read burst)
	const compensationPx = calcCompensation(element, normalWeight, hoverWeight)
	const fontSize = parseFloat(getComputedStyle(element).fontSize)
	const compensationEm = fontSize > 0 ? compensationPx / fontSize : 0

	const onEnter = () => {
		const newFvs = { ...currentFvs, wght: hoverWeight }
		element.style.fontVariationSettings = Object.entries(newFvs)
			.map(([k, v]) => `'${k}' ${v}`)
			.join(', ')
		element.style.letterSpacing = `${compensationEm}em`
		element.style.transition = `font-variation-settings ${duration}ms ease, letter-spacing ${duration}ms ease`
	}

	const onLeave = () => {
		const newFvs = { ...currentFvs, wght: normalWeight }
		element.style.fontVariationSettings = Object.entries(newFvs)
			.map(([k, v]) => `'${k}' ${v}`)
			.join(', ')
		element.style.letterSpacing = ''
	}

	element.addEventListener('mouseenter', onEnter)
	element.addEventListener('mouseleave', onLeave)

	// Return a cleanup function that tears down listeners and resets styles
	return () => {
		element.removeEventListener('mouseenter', onEnter)
		element.removeEventListener('mouseleave', onLeave)
		element.style.fontVariationSettings = ''
		element.style.letterSpacing = ''
		element.style.transition = ''
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
	style.textContent = `[data-bold-shift="${id}"]:hover { letter-spacing: ${compensationEm}em; }`
	document.head.appendChild(style)
}

/**
 * Remove bold-lock markup and restore original HTML.
 * Kept for backwards compatibility with callers that pass originalHTML.
 */
export function removeBoldLock(element: HTMLElement, originalHTML: string): void {
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
