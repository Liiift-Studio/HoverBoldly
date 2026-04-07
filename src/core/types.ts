// weight-hover/src/core/types.ts — types and class constants

/** Options for the interactive weight-hover mode (mouseenter/mouseleave) */
export interface WeightHoverOptions {
	/** wght axis value at rest — defaults to computed font-weight */
	normalWeight?: number
	/** wght axis value on hover — defaults to 700 */
	hoverWeight?: number
	/** Transition duration in milliseconds — defaults to 150 */
	transitionDuration?: number
	/** Compensation mode — defaults to 'element' */
	mode?: 'element' | 'word'
}

/** Options for the static bold-shift mode (CSS :hover { font-weight: bold }) */
export interface BoldShiftOptions {
	/** wght axis value at rest — defaults to 400 */
	normalWeight?: number
	/** wght axis value when bold — defaults to 700 */
	boldWeight?: number
}

/** CSS class names injected by weight-hover — use these to target generated markup */
export const WEIGHT_HOVER_CLASSES = {
	probe: 'wh-probe',
	word: 'wh-word',
} as const
