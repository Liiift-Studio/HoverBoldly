// hoverBoldly/src/react/useBoldLock.ts — React hook
import { useEffect, useRef } from 'react'
import { applyBoldLock } from '../core/adjust'
import type { BoldLockOptions } from '../core/types'

/**
 * React hook that applies the bold-lock effect to a ref'd element.
 * Attaches mouseenter/mouseleave listeners and cleans them up on unmount
 * or when options change.
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
	// Re-run when any relevant option changes
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [options.normalWeight, options.hoverWeight, options.transitionDuration, options.mode])

	// Re-apply after fonts load — calcCompensation uses Canvas API which measures
	// the fallback font if called before the variable font finishes loading.
	useEffect(() => {
		document.fonts?.ready?.then(() => {
			if (!ref.current) return
			cleanupRef.current?.()
			cleanupRef.current = applyBoldLock(ref.current, optionsRef.current)
		})
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return ref
}
