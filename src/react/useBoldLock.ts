// hoverBoldly/src/react/useBoldLock.ts — React hook
import { useEffect, useRef } from 'react'
import { applyBoldLock } from '../core/adjust'
import type { BoldLockOptions } from '../core/types'

/**
 * React hook that applies the bold-lock effect to a ref'd element.
 * Attaches mouseenter/mouseleave listeners and cleans them up on unmount
 * or when key options change (normalWeight, hoverWeight, transitionDuration, mode,
 * axes, falseSlant, proximityThreshold, resizeObserver).
 *
 * Also re-applies after fonts are ready so Canvas compensation is measured against
 * the loaded variable font rather than the fallback.
 */
export function useBoldLock(options: BoldLockOptions) {
	const ref = useRef<HTMLElement>(null)
	const cleanupRef = useRef<(() => void) | null>(null)
	const optionsRef = useRef(options)
	optionsRef.current = options

	useEffect(() => {
		if (!ref.current) return
		cleanupRef.current?.()
		cleanupRef.current = applyBoldLock(ref.current, optionsRef.current)
		return () => {
			cleanupRef.current?.()
			cleanupRef.current = null
		}
	// Re-run when any option that affects measurement or behaviour changes.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		options.normalWeight,
		options.hoverWeight,
		options.transitionDuration,
		options.mode,
		options.axes,
		options.falseSlant,
		options.proximityThreshold,
		options.resizeObserver,
	])

	// Re-apply after fonts load — calcCompensation uses Canvas API which measures
	// the fallback font if called before the variable font finishes loading.
	// A mounted flag prevents applying to a detached node if the component unmounts
	// before the promise resolves, and avoids a double-apply when fonts are already loaded.
	useEffect(() => {
		let mounted = true
		document.fonts?.ready?.then(() => {
			if (!mounted || !ref.current) return
			cleanupRef.current?.()
			cleanupRef.current = applyBoldLock(ref.current, optionsRef.current)
		})
		return () => { mounted = false }
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return ref
}
