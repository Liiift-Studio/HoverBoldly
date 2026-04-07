// weight-hover/src/react/useWeightHover.ts — React hook
import { useEffect, useRef } from 'react'
import { applyWeightHover } from '../core/adjust'
import type { WeightHoverOptions } from '../core/types'

/**
 * React hook that applies the weight-hover effect to a ref'd element.
 * Attaches mouseenter/mouseleave listeners and cleans them up on unmount
 * or when options change.
 */
export function useWeightHover(options: WeightHoverOptions) {
	const ref = useRef<HTMLElement>(null)

	useEffect(() => {
		if (!ref.current) return
		// applyWeightHover returns a cleanup function
		return applyWeightHover(ref.current, options)
	// Re-run when any relevant option changes
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [options.normalWeight, options.hoverWeight, options.transitionDuration])

	return ref
}
