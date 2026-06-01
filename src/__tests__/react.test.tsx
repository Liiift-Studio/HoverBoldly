// hoverBoldly/src/__tests__/react.test.tsx — @testing-library/react hook and component tests
import React, { createRef } from 'react'
import { render, renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useBoldLock } from '../react/useBoldLock'
import { BoldLockText } from '../react/BoldLockText'

// ─── Global mocks ────────────────────────────────────────────────────────────

/**
 * Stub canvas so calcCompensation can run without a real rendering context.
 * Each canvas instance gets its own call counter (matches existing adjust.test pattern).
 */
function spyCanvas(normalMultiplier = 8, boldMultiplier = 10) {
	const realCreate = document.createElement.bind(document)
	vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
		if (tag === 'canvas') {
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

/** Stub getComputedStyle to return a minimal variable-font style. */
function stubComputedStyle(overrides: Partial<CSSStyleDeclaration> = {}) {
	vi.spyOn(window, 'getComputedStyle').mockReturnValue({
		fontVariationSettings: 'normal',
		fontSize: '16px',
		fontFamily: 'sans-serif',
		fontWeight: '400',
		...overrides,
	} as unknown as CSSStyleDeclaration)
}

// ─── useBoldLock ─────────────────────────────────────────────────────────────

describe('useBoldLock', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		stubComputedStyle()
		spyCanvas()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('mounts without throwing', () => {
		expect(() => {
			renderHook(() => useBoldLock({ hoverWeight: 700 }))
		}).not.toThrow()
	})

	it('unmounts without throwing', () => {
		const { unmount } = renderHook(() => useBoldLock({ hoverWeight: 700 }))
		expect(() => unmount()).not.toThrow()
	})

	it('returns a ref object', () => {
		const { result } = renderHook(() => useBoldLock({ hoverWeight: 700 }))
		expect(result.current).toHaveProperty('current')
	})

	it('re-runs effect when hoverWeight changes', () => {
		let weight = 700
		const { rerender } = renderHook(() => useBoldLock({ hoverWeight: weight }))
		expect(() => {
			weight = 800
			rerender()
		}).not.toThrow()
	})

	it('re-runs effect when mode changes', () => {
		let mode: 'element' | 'word' = 'element'
		const { rerender } = renderHook(() => useBoldLock({ hoverWeight: 700, mode }))
		expect(() => {
			mode = 'word'
			rerender()
		}).not.toThrow()
	})

	it('re-runs effect when falseSlant changes', () => {
		let falseSlant: { hoverDeg: number } | undefined = undefined
		const { rerender } = renderHook(() => useBoldLock({ hoverWeight: 700, falseSlant }))
		expect(() => {
			falseSlant = { hoverDeg: -8 }
			rerender()
		}).not.toThrow()
	})

	it('re-runs effect when proximityThreshold changes', () => {
		let proximityThreshold = 100
		const { rerender } = renderHook(() =>
			useBoldLock({ hoverWeight: 700, proximityThreshold }),
		)
		expect(() => {
			proximityThreshold = 200
			rerender()
		}).not.toThrow()
	})
})

// ─── BoldLockText ─────────────────────────────────────────────────────────────

describe('BoldLockText', () => {
	beforeEach(() => {
		document.body.innerHTML = ''
		stubComputedStyle()
		spyCanvas()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('mounts without throwing', () => {
		expect(() => {
			render(<BoldLockText hoverWeight={700}>Hello</BoldLockText>)
		}).not.toThrow()
	})

	it('unmounts without throwing', () => {
		const { unmount } = render(
			<BoldLockText hoverWeight={700}>Hello</BoldLockText>,
		)
		expect(() => unmount()).not.toThrow()
	})

	it('renders children in the document', () => {
		const { container } = render(
			<BoldLockText hoverWeight={700}>Hello world</BoldLockText>,
		)
		expect(container.textContent).toContain('Hello world')
	})

	it('renders a <p> element by default', () => {
		const { container } = render(
			<BoldLockText hoverWeight={700}>Hello</BoldLockText>,
		)
		expect(container.querySelector('p')).not.toBeNull()
	})

	it('forwards className to the root element', () => {
		const { container } = render(
			<BoldLockText hoverWeight={700} className="my-class">Hello</BoldLockText>,
		)
		const root = container.firstElementChild as HTMLElement
		expect(root.classList.contains('my-class')).toBe(true)
	})

	it('has a displayName of BoldLockText', () => {
		expect(BoldLockText.displayName).toBe('BoldLockText')
	})

	it('renders the correct element when "as" prop is set', () => {
		const { container } = render(
			<BoldLockText hoverWeight={700} as="h2">Heading</BoldLockText>,
		)
		expect(container.querySelector('h2')).not.toBeNull()
		expect(container.querySelector('p')).toBeNull()
	})

	it('forwards a ref to the root DOM element', () => {
		const ref = createRef<HTMLElement>()
		render(
			<BoldLockText hoverWeight={700} ref={ref}>Hello</BoldLockText>,
		)
		expect(ref.current).not.toBeNull()
		expect(ref.current?.tagName.toLowerCase()).toBe('p')
	})

	it('applies style prop to the root element', () => {
		const { container } = render(
			<BoldLockText hoverWeight={700} style={{ color: 'red' }}>Hello</BoldLockText>,
		)
		const root = container.firstElementChild as HTMLElement
		expect(root.style.color).toBe('red')
	})

	it('renders with all options without throwing', () => {
		expect(() => {
			render(
				<BoldLockText
					hoverWeight={700}
					normalWeight={400}
					transitionDuration={200}
					mode="word"
					proximityThreshold={120}
					resizeObserver={false}
					axes={{ slnt: { hover: -12 } }}
					falseSlant={{ hoverDeg: -8 }}
				>
					Hello world
				</BoldLockText>,
			)
		}).not.toThrow()
	})
})
