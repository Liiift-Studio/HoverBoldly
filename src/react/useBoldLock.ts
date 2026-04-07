// bold-lock/src/react/useBoldLock.ts — React hook
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

	useEffect(() => {
		if (!ref.current) return
		// applyBoldLock returns a cleanup function
		return applyBoldLock(ref.current, options)
	// Re-run when any relevant option changes
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [options.normalWeight, options.hoverWeight, options.transitionDuration])

	return ref
}
