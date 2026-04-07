// weight-hover/src/react/useWeightHover.ts — React hook
import { useCallback, useLayoutEffect, useRef } from 'react'
import { applyWeightHover, getCleanHTML } from '../core/adjust'
import type { WeightHoverOptions } from '../core/types'

/**
 * React hook that applies the weight-hover effect to a ref'd element.
 * Automatically re-runs on resize (width changes only).
 */
export function useWeightHover(options: WeightHoverOptions) {
	const ref = useRef<HTMLElement>(null)
	const originalHTMLRef = useRef<string | null>(null)
	const optionsRef = useRef(options)
	optionsRef.current = options

	const run = useCallback(() => {
		const el = ref.current
		if (!el) return
		if (originalHTMLRef.current === null) {
			originalHTMLRef.current = getCleanHTML(el)
		}
		applyWeightHover(el, originalHTMLRef.current, optionsRef.current)
	}, [])

	useLayoutEffect(() => {
		run()

		let lastWidth = 0
		let rafId = 0
		const ro = new ResizeObserver((entries) => {
			const w = Math.round(entries[0].contentRect.width)
			if (w === lastWidth) return
			lastWidth = w
			cancelAnimationFrame(rafId)
			rafId = requestAnimationFrame(run)
		})
		ro.observe(ref.current!)
		return () => {
			ro.disconnect()
			cancelAnimationFrame(rafId)
		}
	}, [run])

	return ref
}
