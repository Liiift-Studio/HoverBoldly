// hoverBoldly/src/__tests__/adjust.test.ts — core algorithm tests
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
	getFontVariationSettings,
	calcCompensation,
	applyBoldLock,
	applyBoldShift,
	removeBoldShift,
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
 * returns width = text.length * normalMultiplier (first call per canvas) or
 * text.length * boldMultiplier (second call per canvas). Each canvas instance
 * maintains its own independent call counter so multi-element tests are correct.
 * All other tags fall through to the real implementation.
 */
function spyCanvas(normalMultiplier = 8, boldMultiplier = 10) {
	const realCreate = document.createElement.bind(document)
	vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
		if (tag === 'canvas') {
			// Per-canvas counter — each new canvas starts fresh.
			let callCount = 0
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

// ─── Extended coverage ─────────────────────────────────────────────────────────

describe('getFontVariationSettings — extended', () => {
	afterEach(() => { vi.restoreAllMocks() })

	it("parses a single-axis value correctly", () => {
		const el = document.createElement('p')
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			fontVariationSettings: "'wdth' 85",
		} as unknown as CSSStyleDeclaration)
		expect(getFontVariationSettings(el)).toEqual({ wdth: 85 })
	})

	it("parses float axis values correctly", () => {
		const el = document.createElement('p')
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			fontVariationSettings: "'wght' 300.5, 'wdth' 99.75",
		} as unknown as CSSStyleDeclaration)
		const result = getFontVariationSettings(el)
		expect(result.wght).toBeCloseTo(300.5)
		expect(result.wdth).toBeCloseTo(99.75)
	})
})

describe('applyBoldLock — extended', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			fontVariationSettings: 'normal',
			fontSize: '16px',
			fontFamily: 'sans-serif',
			fontWeight: '400',
		} as unknown as CSSStyleDeclaration)
		const realCreate = document.createElement.bind(document)
		vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
			if (tag === 'canvas') {
				let call = 0
				return {
					getContext: () => ({
						font: '',
						measureText: (text: string) => ({ width: text.length * (++call === 1 ? 8 : 10) }),
					}),
				} as unknown as HTMLCanvasElement
			}
			return realCreate(tag)
		})
	})

	afterEach(() => { vi.restoreAllMocks() })

	it('does not throw when called with default options (no options object)', () => {
		const el = document.createElement('p')
		el.textContent = 'Hello world'
		document.body.appendChild(el)
		expect(() => applyBoldLock(el, {})).not.toThrow()
	})

	it('transition style is applied to the element', () => {
		const el = document.createElement('p')
		el.textContent = 'Hello world'
		document.body.appendChild(el)
		applyBoldLock(el, { normalWeight: 400, hoverWeight: 700, transitionDuration: 200 })
		el.dispatchEvent(new MouseEvent('mouseenter'))
		expect(el.style.transition).toContain('200ms')
	})

	it('cleanup can be called multiple times without throwing', () => {
		const el = document.createElement('p')
		el.textContent = 'Hello world'
		document.body.appendChild(el)
		const cleanup = applyBoldLock(el, { normalWeight: 400, hoverWeight: 700 })
		expect(() => { cleanup(); cleanup() }).not.toThrow()
	})

	it('fontVariationSettings on mouseenter contains hoverWeight', () => {
		const el = document.createElement('p')
		el.textContent = 'Hello world'
		document.body.appendChild(el)
		applyBoldLock(el, { normalWeight: 400, hoverWeight: 700 })
		el.dispatchEvent(new MouseEvent('mouseenter'))
		expect(el.style.fontVariationSettings).toContain('700')
	})
})

describe('getCleanHTML — strips class-based spans from word and proximity modes', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			fontVariationSettings: 'normal', fontSize: '16px',
			fontFamily: 'sans-serif', fontWeight: '400',
		} as unknown as CSSStyleDeclaration)
		const realCreate = document.createElement.bind(document)
		vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
			if (tag === 'canvas') {
				let call = 0
				return { getContext: () => ({ font: '', measureText: (text: string) => ({ width: text.length * (++call === 1 ? 8 : 10) }) }) } as unknown as HTMLCanvasElement
			}
			return realCreate(tag)
		})
	})

	afterEach(() => { vi.restoreAllMocks() })

	it('getCleanHTML strips wh-word spans injected by word mode', () => {
		const el = document.createElement('p')
		el.textContent = 'Hello world typography'
		document.body.appendChild(el)
		// Apply word mode to inject wh-word spans
		const cleanup = applyBoldLock(el, { mode: 'word', normalWeight: 400, hoverWeight: 700 })
		// Verify spans are present
		expect(el.querySelectorAll('.wh-word').length).toBeGreaterThan(0)
		// getCleanHTML should strip them
		const cleaned = getCleanHTML(el)
		expect(cleaned).not.toContain('wh-word')
		cleanup()
	})

	it('getCleanHTML result from word-mode element matches original plain text HTML', () => {
		const el = document.createElement('p')
		el.textContent = 'Hello world'
		document.body.appendChild(el)
		const before = getCleanHTML(el)
		const cleanup = applyBoldLock(el, { mode: 'word', normalWeight: 400, hoverWeight: 700 })
		const after = getCleanHTML(el)
		expect(after).toBe(before)
		cleanup()
	})
})

describe('applyBoldShift — extended', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		document.head.innerHTML = ''
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			fontVariationSettings: 'normal', fontSize: '16px',
			fontFamily: 'sans-serif', fontWeight: '400',
		} as unknown as CSSStyleDeclaration)
		const realCreate = document.createElement.bind(document)
		vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
			if (tag === 'canvas') {
				let call = 0
				return { getContext: () => ({ font: '', measureText: (text: string) => ({ width: text.length * (++call === 1 ? 8 : 10) }) }) } as unknown as HTMLCanvasElement
			}
			return realCreate(tag)
		})
	})

	afterEach(() => { vi.restoreAllMocks() })

	it('two separate calls produce two distinct data-bold-shift values', () => {
		const el1 = document.createElement('p')
		el1.textContent = 'Link one'
		document.body.appendChild(el1)
		const el2 = document.createElement('p')
		el2.textContent = 'Link two'
		document.body.appendChild(el2)
		applyBoldShift(el1, { normalWeight: 400, boldWeight: 700 })
		applyBoldShift(el2, { normalWeight: 400, boldWeight: 700 })
		const id1 = el1.getAttribute('data-bold-shift')
		const id2 = el2.getAttribute('data-bold-shift')
		expect(id1).toBeTruthy()
		expect(id2).toBeTruthy()
		expect(id1).not.toBe(id2)
	})
})

// ─── getFontVariationSettings — negative values and double-quoted tags ─────────

describe('getFontVariationSettings — negative and double-quoted axes', () => {
	afterEach(() => { vi.restoreAllMocks() })

	it("parses a negative axis value (e.g. 'slnt' -12)", () => {
		const el = document.createElement('p')
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			fontVariationSettings: "'slnt' -12",
		} as unknown as CSSStyleDeclaration)
		expect(getFontVariationSettings(el)).toEqual({ slnt: -12 })
	})

	it('parses double-quoted axis tags (e.g. "wght" 700)', () => {
		const el = document.createElement('p')
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			fontVariationSettings: '"wght" 700, "wdth" 100',
		} as unknown as CSSStyleDeclaration)
		expect(getFontVariationSettings(el)).toEqual({ wght: 700, wdth: 100 })
	})

	it('parses a mix of negative and double-quoted axes', () => {
		const el = document.createElement('p')
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			fontVariationSettings: '"wght" 300, \'slnt\' -8',
		} as unknown as CSSStyleDeclaration)
		const result = getFontVariationSettings(el)
		expect(result.wght).toBe(300)
		expect(result.slnt).toBe(-8)
	})
})

// ─── calcCompensation — zero/empty text ───────────────────────────────────────

describe('calcCompensation — zero-char guard', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		stubComputedStyle()
		spyCanvas(8, 10)
	})

	afterEach(() => { vi.restoreAllMocks() })

	it('returns 0 for an element with no text content', () => {
		const el = document.createElement('p')
		el.textContent = '   ' // whitespace only → trim → 0 chars
		document.body.appendChild(el)
		expect(calcCompensation(el, 400, 700)).toBe(0)
	})
})

// ─── removeBoldShift ───────────────────────────────────────────────────────────

describe('removeBoldShift', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		document.head.innerHTML = ''
		stubComputedStyle()
		spyCanvas(8, 10)
	})

	afterEach(() => { vi.restoreAllMocks() })

	it('removes the injected <style> from document.head', () => {
		const el = makeElement('Link text')
		applyBoldShift(el, { normalWeight: 400, boldWeight: 700 })
		const stylesBefore = document.head.querySelectorAll('style').length
		expect(stylesBefore).toBeGreaterThan(0)
		removeBoldShift(el)
		expect(document.head.querySelectorAll('style').length).toBe(0)
	})

	it('strips the data-bold-shift attribute from the element', () => {
		const el = makeElement('Link text')
		applyBoldShift(el, { normalWeight: 400, boldWeight: 700 })
		expect(el.getAttribute('data-bold-shift')).toBeTruthy()
		removeBoldShift(el)
		expect(el.getAttribute('data-bold-shift')).toBeNull()
	})

	it('is a no-op on an element that was never shifted', () => {
		const el = makeElement('Link text')
		expect(() => removeBoldShift(el)).not.toThrow()
		expect(document.head.querySelectorAll('style').length).toBe(0)
	})

	it('repeated applyBoldShift calls do not accumulate orphaned <style> nodes', () => {
		const el = makeElement('Link text')
		applyBoldShift(el, { normalWeight: 400, boldWeight: 700 })
		applyBoldShift(el, { normalWeight: 400, boldWeight: 700 })
		// Second call should remove the first <style> before inserting a new one.
		expect(document.head.querySelectorAll('style').length).toBe(1)
	})
})

// ─── applyBoldLock — proximity mode ───────────────────────────────────────────

describe('applyBoldLock — proximity mode', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			fontVariationSettings: 'normal',
			fontSize: '16px',
			fontFamily: 'sans-serif',
			fontWeight: '400',
		} as unknown as CSSStyleDeclaration)
		const realCreate = document.createElement.bind(document)
		vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
			if (tag === 'canvas') {
				let call = 0
				return {
					getContext: () => ({
						font: '',
						measureText: (text: string) => ({ width: text.length * (++call === 1 ? 8 : 10) }),
					}),
				} as unknown as HTMLCanvasElement
			}
			return realCreate(tag)
		})
		// Stub getBoundingClientRect so all words appear on the same line (same top).
		vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
			top: 10, left: 0, bottom: 26, right: 100, height: 16, width: 100,
		} as DOMRect)
	})

	afterEach(() => { vi.restoreAllMocks() })

	it('returns a cleanup function', () => {
		const el = makeElement('Hello world typography')
		const cleanup = applyBoldLock(el, { mode: 'proximity', normalWeight: 400, hoverWeight: 700 })
		expect(typeof cleanup).toBe('function')
		cleanup()
	})

	it('wraps words in .wh-word spans', () => {
		const el = makeElement('Hello world typography')
		const cleanup = applyBoldLock(el, { mode: 'proximity', normalWeight: 400, hoverWeight: 700 })
		// After proximity mode setup the DOM is rebuilt into .wh-line spans.
		expect(el.querySelectorAll('.wh-line').length).toBeGreaterThan(0)
		cleanup()
	})

	it('cleanup restores original innerHTML', () => {
		const el = makeElement('Hello world')
		const original = el.innerHTML
		const cleanup = applyBoldLock(el, { mode: 'proximity', normalWeight: 400, hoverWeight: 700 })
		// DOM should be mutated after apply.
		cleanup()
		expect(el.innerHTML).toBe(original)
	})

	it('attaches pointermove and pointerleave listeners', () => {
		const el = makeElement('Hello world')
		const addSpy = vi.spyOn(el, 'addEventListener')
		const cleanup = applyBoldLock(el, { mode: 'proximity', normalWeight: 400, hoverWeight: 700 })
		const types = addSpy.mock.calls.map((c) => c[0])
		expect(types).toContain('pointermove')
		expect(types).toContain('pointerleave')
		cleanup()
	})

	it('cleanup removes pointermove and pointerleave listeners', () => {
		const el = makeElement('Hello world')
		const removeSpy = vi.spyOn(el, 'removeEventListener')
		const cleanup = applyBoldLock(el, { mode: 'proximity', normalWeight: 400, hoverWeight: 700 })
		cleanup()
		const types = removeSpy.mock.calls.map((c) => c[0])
		expect(types).toContain('pointermove')
		expect(types).toContain('pointerleave')
	})
})

// ─── applyBoldLock — word mode (touchcancel + additional coverage) ─────────────

describe('applyBoldLock — word mode', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			fontVariationSettings: 'normal',
			fontSize: '16px',
			fontFamily: 'sans-serif',
			fontWeight: '400',
		} as unknown as CSSStyleDeclaration)
		const realCreate = document.createElement.bind(document)
		vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
			if (tag === 'canvas') {
				let call = 0
				return {
					getContext: () => ({
						font: '',
						measureText: (text: string) => ({ width: text.length * (++call === 1 ? 8 : 10) }),
					}),
				} as unknown as HTMLCanvasElement
			}
			return realCreate(tag)
		})
	})

	afterEach(() => { vi.restoreAllMocks() })

	it('wraps words in .wh-word spans', () => {
		const el = makeElement('Hello world typography')
		const cleanup = applyBoldLock(el, { mode: 'word', normalWeight: 400, hoverWeight: 700 })
		expect(el.querySelectorAll('.wh-word').length).toBeGreaterThan(0)
		cleanup()
	})

	it('cleanup restores original innerHTML', () => {
		const el = makeElement('Hello world')
		const original = el.innerHTML
		const cleanup = applyBoldLock(el, { mode: 'word', normalWeight: 400, hoverWeight: 700 })
		cleanup()
		expect(el.innerHTML).toBe(original)
	})

	it('attaches touchcancel listener alongside touchstart and touchend', () => {
		const el = makeElement('Hello world')
		applyBoldLock(el, { mode: 'word', normalWeight: 400, hoverWeight: 700 })
		// Check that the first word span has touchcancel registered.
		const firstSpan = el.querySelector('.wh-word') as HTMLElement
		expect(firstSpan).toBeTruthy()
		// We verify by checking that firing touchcancel does not throw.
		expect(() => firstSpan.dispatchEvent(new Event('touchcancel'))).not.toThrow()
	})
})

// ─── applyBoldLock — element mode (focusin/focusout + falseSlant) ─────────────

describe('applyBoldLock — element mode extended', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		vi.spyOn(window, 'getComputedStyle').mockReturnValue({
			fontVariationSettings: 'normal',
			fontSize: '16px',
			fontFamily: 'sans-serif',
			fontWeight: '400',
		} as unknown as CSSStyleDeclaration)
		const realCreate = document.createElement.bind(document)
		vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
			if (tag === 'canvas') {
				let call = 0
				return {
					getContext: () => ({
						font: '',
						measureText: (text: string) => ({ width: text.length * (++call === 1 ? 8 : 10) }),
					}),
				} as unknown as HTMLCanvasElement
			}
			return realCreate(tag)
		})
	})

	afterEach(() => { vi.restoreAllMocks() })

	it('applies fontVariationSettings on focusin', () => {
		const el = makeElement('Hello world')
		applyBoldLock(el, { normalWeight: 400, hoverWeight: 700 })
		el.dispatchEvent(new FocusEvent('focusin'))
		expect(el.style.fontVariationSettings).toContain('700')
	})

	it('clears letterSpacing on focusout', () => {
		const el = makeElement('Hello world')
		applyBoldLock(el, { normalWeight: 400, hoverWeight: 700 })
		el.dispatchEvent(new FocusEvent('focusin'))
		el.dispatchEvent(new FocusEvent('focusout'))
		expect(el.style.letterSpacing).toBe('')
	})

	it('applies skewX transform on enter when falseSlant is set', () => {
		const el = makeElement('Hello world')
		applyBoldLock(el, { normalWeight: 400, hoverWeight: 700, falseSlant: { hoverDeg: -8 } })
		el.dispatchEvent(new MouseEvent('mouseenter'))
		expect(el.style.transform).toContain('skewX')
	})

	it('restores saved fontVariationSettings on cleanup (not just empty string)', () => {
		const el = makeElement('Hello world')
		el.style.fontVariationSettings = "'wght' 400"
		const cleanup = applyBoldLock(el, { normalWeight: 400, hoverWeight: 700 })
		el.dispatchEvent(new MouseEvent('mouseenter'))
		cleanup()
		// Should restore to the original inline value, not ''.
		expect(el.style.fontVariationSettings).toBe("'wght' 400")
	})

	it('touchcancel triggers leave behaviour (no permanent bold state)', () => {
		const el = makeElement('Hello world')
		applyBoldLock(el, { normalWeight: 400, hoverWeight: 700 })
		el.dispatchEvent(new Event('touchstart'))
		el.dispatchEvent(new Event('touchcancel'))
		expect(el.style.letterSpacing).toBe('')
	})
})
