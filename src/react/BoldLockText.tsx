// bold-lock/src/react/BoldLockText.tsx — React component wrapper
import React, { forwardRef } from 'react'
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
 */
export const BoldLockText = forwardRef<HTMLElement, BoldLockTextProps>(
	function BoldLockText({ children, className, style, as: Tag = 'p', ...options }, _ref) {
		const innerRef = useBoldLock(options)
		return (
			<Tag ref={innerRef as React.Ref<HTMLElement>} className={className} style={style}>
				{children}
			</Tag>
		)
	},
)

BoldLockText.displayName = 'BoldLockText'
