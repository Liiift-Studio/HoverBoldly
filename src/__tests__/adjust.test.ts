// weight-hover/src/__tests__/adjust.test.ts — core algorithm tests
import { describe, it, expect, beforeEach } from 'vitest'
import { applyWeightHover, removeWeightHover, getCleanHTML } from '../core/adjust'
import { WEIGHT_HOVER_CLASSES } from '../core/types'

// ─── DOM measurement mock ─────────────────────────────────────────────────────
const CONTAINER_WIDTH = 600
const WORD_WIDTH = 80

function mockMeasurement() {
	const proto = Object.getPrototypeOf(document.createElement('div'))
	Object.defineProperty(proto, 'offsetWidth', {
		configurable: true,
		get: function (this: HTMLElement) {
			if (this.classList?.contains(WEIGHT_HOVER_CLASSES.probe)) return 0
			if (this.classList?.contains(WEIGHT_HOVER_CLASSES.word)) return WORD_WIDTH
			return CONTAINER_WIDTH
		},
	})
	Element.prototype.getBoundingClientRect = function (this: Element) {
		const el = this as HTMLElement
		if (el.classList?.contains(WEIGHT_HOVER_CLASSES.probe)) return { width: 0 } as DOMRect
		const w = el.classList?.contains(WEIGHT_HOVER_CLASSES.word) ? WORD_WIDTH : CONTAINER_WIDTH
		return { width: w, height: 20, top: 0, left: 0, right: w, bottom: 20, x: 0, y: 0, toJSON: () => {} }
	}
}

function makeElement(html: string): HTMLElement {
	const el = document.createElement('p')
	el.innerHTML = html
	el.style.width = `${CONTAINER_WIDTH}px`
	document.body.appendChild(el)
	return el
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('weight-hover', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		mockMeasurement()
	})

	it('getCleanHTML is idempotent', () => {
		const el = makeElement('<em>Hello</em> world')
		const html = getCleanHTML(el)
		const html2 = getCleanHTML(el)
		expect(html).toBe(html2)
	})

	it('applyWeightHover does not throw on empty element', () => {
		const el = makeElement('')
		const original = getCleanHTML(el)
		expect(() => applyWeightHover(el, original, {})).not.toThrow()
	})

	it('removeWeightHover restores original HTML', () => {
		const el = makeElement('<em>Hello</em> world')
		const original = getCleanHTML(el)
		applyWeightHover(el, original, {})
		removeWeightHover(el, original)
		expect(el.innerHTML).toBe(original)
	})

	it('preserves inline elements', () => {
		const el = makeElement('<em>italic</em> and <strong>bold</strong>')
		const original = getCleanHTML(el)
		applyWeightHover(el, original, {})
		expect(el.querySelector('em')).toBeTruthy()
		expect(el.querySelector('strong')).toBeTruthy()
	})
})
