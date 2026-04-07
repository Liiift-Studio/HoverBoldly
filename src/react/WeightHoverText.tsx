// weight-hover/src/react/WeightHoverText.tsx — React component wrapper
import React, { forwardRef } from 'react'
import { useWeightHover } from './useWeightHover'
import type { WeightHoverOptions } from '../core/types'

interface WeightHoverTextProps extends WeightHoverOptions {
	children: React.ReactNode
	className?: string
	style?: React.CSSProperties
	as?: React.ElementType
}

/**
 * Drop-in component that applies the weight-hover effect to its children.
 */
export const WeightHoverText = forwardRef<HTMLElement, WeightHoverTextProps>(
	function WeightHoverText({ children, className, style, as: Tag = 'p', ...options }, _ref) {
		const innerRef = useWeightHover(options)
		return (
			<Tag ref={innerRef as React.Ref<HTMLElement>} className={className} style={style}>
				{children}
			</Tag>
		)
	},
)

WeightHoverText.displayName = 'WeightHoverText'
