// hoverBoldly/src/core/types.ts — types and class constants

/** Configuration for a single additional variable font axis driven on hover */
export interface AxisConfig {
	/** Axis value at rest — defaults to the element's current computed value for that axis */
	normal?: number
	/** Axis value on hover */
	hover: number
}

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
	/**
	 * Re-measure and reapply letter-spacing compensation whenever the element's
	 * size changes (e.g. when responsive clamp() typography alters font-size at a
	 * new viewport width). Uses a ResizeObserver internally. Default: true
	 */
	resizeObserver?: boolean
	/**
	 * Additional variable font axes to drive on hover, beyond wght.
	 * Each key is an OpenType axis tag (e.g. 'slnt', 'wdth', 'ital').
	 * Applied on top of the element's existing fontVariationSettings.
	 *
	 * Letter-spacing compensation is only calculated for the wght axis.
	 * Axes that change advance widths (e.g. wdth) will cause slight line-length
	 * changes — use small deltas to keep the effect imperceptible.
	 *
	 * In proximity mode each axis is interpolated by cursor-distance strength,
	 * the same way wght is.
	 *
	 * @example
	 * // Lean forward and condense slightly on hover
	 * axes: { slnt: { hover: -12 }, wdth: { normal: 100, hover: 95 } }
	 */
	axes?: Record<string, AxisConfig>
	/**
	 * Fake a slant using CSS transform: skewX() for fonts without a slnt variable axis.
	 * Does not affect advance widths. In proximity mode the skew is scaled
	 * proportionally to cursor distance, giving each line its own lean.
	 *
	 * Saves and restores the element's original transform on cleanup.
	 *
	 * @example
	 * falseSlant: { hoverDeg: -8 }             // lean forward 8° on hover
	 * falseSlant: { hoverDeg: 8, normalDeg: 0 } // lean back on hover
	 */
	falseSlant?: {
		/** skewX degrees on hover. Negative = forward lean (italic direction). */
		hoverDeg: number
		/** skewX degrees at rest. Defaults to 0 (upright). */
		normalDeg?: number
	}
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
