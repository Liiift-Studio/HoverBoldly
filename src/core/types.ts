// hoverBoldly/src/core/types.ts — types and class constants

/** Options for the interactive bold-lock mode (mouseenter/mouseleave) */
export interface BoldLockOptions {
	/** wght axis value at rest — defaults to computed font-weight */
	normalWeight?: number
	/** wght axis value on hover — defaults to 700 */
	hoverWeight?: number
	/** Transition duration in milliseconds — defaults to 150 */
	transitionDuration?: number
	/**
	 * Interaction mode. Default: 'element'
	 *
	 * - **'element'** — the whole element bolds together on mouseenter/mouseleave.
	 * - **'word'** — each word is an independent hover target.
	 * - **'proximity'** — weight increases continuously per line based on cursor
	 *   distance. Lines nearest the cursor are heaviest; weight fades with distance.
	 *   Width compensation is pre-calculated per line at mount time and scaled
	 *   proportionally to the weight change.
	 */
	mode?: 'element' | 'word' | 'proximity'
	/**
	 * Distance in px from a line's center over which weight fades from hoverWeight
	 * to normalWeight. Only used in 'proximity' mode. Default: 120
	 */
	proximityThreshold?: number
}

/** Options for the static bold-shift mode (CSS :hover { font-weight: bold }) */
export interface BoldShiftOptions {
	/** wght axis value at rest — defaults to 400 */
	normalWeight?: number
	/** wght axis value when bold — defaults to 700 */
	boldWeight?: number
}

/** CSS class names injected by bold-lock — use these to target generated markup */
export const BOLD_LOCK_CLASSES = {
	probe: 'wh-probe',
	word: 'wh-word',
	line: 'wh-line',
} as const
