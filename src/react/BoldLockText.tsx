// hoverBoldly/src/react/BoldLockText.tsx — React component wrapper
import React, { forwardRef, useCallback } from 'react'
import { useBoldLock } from './useBoldLock'
import type { BoldLockOptions } from '../core/types'

interface BoldLockTextProps extends BoldLockOptions {
	children: React.ReactNode
	className?: string
	style?: React.CSSProperties
	as?: React.ElementType
}

/**
 * Drop-in component that applies the bold-lock effect to its children.
 * The forwarded ref is merged with the internal hook ref so both point
 * to the root DOM element.
 */
export const BoldLockText = forwardRef<HTMLElement, BoldLockTextProps>(
	function BoldLockText({ children, className, style, as: Tag = 'p', ...options }, ref) {
		const innerRef = useBoldLock(options)

		/** Merge the forwarded ref with the internal hook ref. */
		const mergedRef = useCallback(
			(node: HTMLElement | null) => {
				;(innerRef as React.MutableRefObject<HTMLElement | null>).current = node
				if (typeof ref === 'function') {
					ref(node)
				} else if (ref) {
					;(ref as React.MutableRefObject<HTMLElement | null>).current = node
				}
			},
			[innerRef, ref],
		)

		return (
			<Tag ref={mergedRef} className={className} style={style}>
				{children}
			</Tag>
		)
	},
)

BoldLockText.displayName = 'BoldLockText'
