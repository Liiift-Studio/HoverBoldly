// bold-lock/src/__tests__/adjust.test.ts — core algorithm tests
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
	getFontVariationSettings,
	calcCompensation,
	applyBoldLock,
	applyBoldShift,
	removeBoldLock,
	getCleanHTML,
} from '../core/adjust'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeElement(text: string, tag = 'p'): HTMLElement {
	const el = document.createElement(tag)
	el.textContent = text
	document.body.appendChild(el)
	return el
}

function makeElementHTML(html: string): HTMLElement {
	const el = document.createElement('p')
	el.innerHTML = html
	document.body.appendChild(el)
	return el
}

/**
 * Spy on document.createElement so canvas tags return a stub whose measureText
 * returns width = text.length * multiplier (first call) or text.length * boldMultiplier
 * (second call).  All other tags fall through to the real implementation.
 */
function spyCanvas(normalMultiplier = 8, boldMultiplier = 10) {
	const realCreate = document.createElement.bind(document)
	let callCount = 0
	vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
		if (tag === 'canvas') {
			return {
				getContext: () => ({
					font: '',
					measureText: (text: string) => {
						callCount++
						const m = callCount === 1 ? normalMultiplier : boldMultiplier
						return { width: text.length * m }
					},
				}),
			} as unknown as HTMLCanvasElement
		}
		return realCreate(tag)
	})
}

/** Stub getComputedStyle for a simple element with no variation settings. */
function stubComputedStyle(overrides: Partial<CSSStyleDeclaration> = {}) {
	vi.spyOn(window, 'getComputedStyle').mockReturnValue({
		fontVariationSettings: 'normal',
		fontSize: '16px',
		fontFamily: 'sans-serif',
		fontWeight: '400',
		...overrides,
	} as unknown as CSSStyleDeclaration)
}

// ─── getFontVariationSettings ─────────────────────────────────────────────────

describe('getFontVariationSettings', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it("parses \"'wght' 300, 'wdth' 100\" into { wght: 300, wdth: 100 }", () => {
		const el = makeElement('Hello')
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			fontVariationSettings: "'wght' 300, 'wdth' 100",
		} as unknown as CSSStyleDeclaration)

		expect(getFontVariationSettings(el)).toEqual({ wght: 300, wdth: 100 })
	})

	it("returns {} for 'normal'", () => {
		const el = makeElement('Hello')
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			fontVariationSettings: 'normal',
		} as unknown as CSSStyleDeclaration)

		expect(getFontVariationSettings(el)).toEqual({})
	})

	it('returns {} for empty fontVariationSettings', () => {
		const el = makeElement('Hello')
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			fontVariationSettings: '',
		} as unknown as CSSStyleDeclaration)

		expect(getFontVariationSettings(el)).toEqual({})
	})
})

// ─── calcCompensation ─────────────────────────────────────────────────────────

describe('calcCompensation', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('returns a negative number for multi-character text when bold is wider', () => {
		const el = makeElement('Hello')
		stubComputedStyle()
		// normal multiplier 8, bold multiplier 10 → bold is wider → compensation < 0
		spyCanvas(8, 10)

		const result = calcCompensation(el, 400, 700)
		expect(result).toBeLessThan(0)
	})

	it('returns 0 for single-character text', () => {
		const el = makeElement('A')
		stubComputedStyle()
		spyCanvas(8, 10)

		const result = calcCompensation(el, 400, 700)
		expect(result).toBe(0)
	})
})

// ─── applyBoldLock ─────────────────────────────────────────────────────────────

describe('applyBoldLock', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		// Provide canvas + getComputedStyle stubs so applyBoldLock can run
		stubComputedStyle()
		spyCanvas(8, 10)
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('adds mouseenter and mouseleave listeners', () => {
		const el = makeElement('Hello world')
		const addSpy = vi.spyOn(el, 'addEventListener')

		applyBoldLock(el, { normalWeight: 400, hoverWeight: 700 })

		const types = addSpy.mock.calls.map((c) => c[0])
		expect(types).toContain('mouseenter')
		expect(types).toContain('mouseleave')
	})

	it('returns a cleanup function that removes listeners', () => {
		const el = makeElement('Hello world')
		const removeSpy = vi.spyOn(el, 'removeEventListener')

		const cleanup = applyBoldLock(el, { normalWeight: 400, hoverWeight: 700 })
		cleanup()

		const types = removeSpy.mock.calls.map((c) => c[0])
		expect(types).toContain('mouseenter')
		expect(types).toContain('mouseleave')
	})

	it('restores element styles after cleanup', () => {
		const el = makeElement('Hello world')
		const cleanup = applyBoldLock(el, { normalWeight: 400, hoverWeight: 700 })

		// Trigger hover to dirty styles
		el.dispatchEvent(new MouseEvent('mouseenter'))
		expect(el.style.letterSpacing).not.toBe('')

		cleanup()
		expect(el.style.fontVariationSettings).toBe('')
		expect(el.style.letterSpacing).toBe('')
		expect(el.style.transition).toBe('')
	})

	it('sets fontVariationSettings and letterSpacing on mouseenter', () => {
		const el = makeElement('Hello world')
		applyBoldLock(el, { normalWeight: 400, hoverWeight: 700 })

		el.dispatchEvent(new MouseEvent('mouseenter'))
		expect(el.style.fontVariationSettings).toContain('wght')
		expect(el.style.letterSpacing).not.toBe('')
	})

	it('clears letterSpacing on mouseleave', () => {
		const el = makeElement('Hello world')
		applyBoldLock(el, { normalWeight: 400, hoverWeight: 700 })

		el.dispatchEvent(new MouseEvent('mouseenter'))
		el.dispatchEvent(new MouseEvent('mouseleave'))
		expect(el.style.letterSpacing).toBe('')
	})

	it('returns a function in all cases', () => {
		const el = makeElement('test')
		const cleanup = applyBoldLock(el, {})
		expect(typeof cleanup).toBe('function')
	})
})

// ─── applyBoldShift ────────────────────────────────────────────────────────────

describe('applyBoldShift', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		document.head.innerHTML = ''
		stubComputedStyle()
		spyCanvas(8, 10)
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('adds a data-bold-shift attribute to the element', () => {
		const el = makeElement('Navigation link')
		applyBoldShift(el, { normalWeight: 400, boldWeight: 700 })
		expect(el.getAttribute('data-bold-shift')).toBeTruthy()
	})

	it('inserts a <style> element into document.head', () => {
		const el = makeElement('Navigation link')
		const stylesBefore = document.head.querySelectorAll('style').length
		applyBoldShift(el, { normalWeight: 400, boldWeight: 700 })
		expect(document.head.querySelectorAll('style').length).toBeGreaterThan(stylesBefore)
	})
})

// ─── Legacy helpers ────────────────────────────────────────────────────────────

describe('getCleanHTML / removeBoldLock', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
	})

	it('getCleanHTML is idempotent', () => {
		const el = makeElementHTML('<em>Hello</em> world')
		expect(getCleanHTML(el)).toBe(getCleanHTML(el))
	})

	it('removeBoldLock restores original HTML', () => {
		const el = makeElementHTML('<em>Hello</em> world')
		const original = getCleanHTML(el)
		el.innerHTML = '<span>mutated</span>'
		removeBoldLock(el, original)
		expect(el.innerHTML).toBe(original)
	})
})
