// weight-hover/src/core/adjust.ts — framework-agnostic algorithm
import type { WeightHoverOptions } from './types'

/**
 * Strip any prior weight-hover markup from an element and return clean innerHTML.
 * Safe to call multiple times — idempotent.
 */
export function getCleanHTML(el: HTMLElement): string {
	const clone = el.cloneNode(true) as HTMLElement
	clone.querySelectorAll('[data-weight-hover]').forEach((node) => {
		node.replaceWith(...node.childNodes)
	})
	return clone.innerHTML
}

/**
 * Apply weight-hover effect to an element.
 * @param element   - Target element
 * @param originalHTML - Clean HTML snapshot from getCleanHTML()
 * @param options   - WeightHoverOptions
 */
export function applyWeightHover(
	element: HTMLElement,
	originalHTML: string,
	options: WeightHoverOptions,
): void {
	if (typeof window === 'undefined') return

	// Save scroll position — iOS Safari does not support overflow-anchor: none
	const scrollY = window.scrollY

	// Pass 1: Reset to original HTML (idempotent)
	element.innerHTML = originalHTML

	// TODO: implement weight-hover algorithm
	// Follow the pattern from PROCESS.md:
	//   - Batch all DOM reads before writes
	//   - Use recursive childNodes walk (not createTreeWalker — happy-dom bug)
	//   - Give measurement probes a distinct CSS class

	// Restore scroll after DOM mutations
	requestAnimationFrame(() => {
		if (Math.abs(window.scrollY - scrollY) > 2) {
			window.scrollTo({ top: scrollY, behavior: 'instant' })
		}
	})
}

/**
 * Remove weight-hover markup and restore original HTML.
 */
export function removeWeightHover(element: HTMLElement, originalHTML: string): void {
	element.innerHTML = originalHTML
}
