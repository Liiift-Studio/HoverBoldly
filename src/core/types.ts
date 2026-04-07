// weight-hover/src/core/types.ts — types and class constants
export interface WeightHoverOptions {
	// hoverWeight (target wght on hover)
	// normalWeight (default wght)
	// mode ('line' | 'word' | 'element')
	// prefer ('wdth' | 'tracking' | 'auto')
	// transitionDuration (ms)
}

/** CSS class names injected by weight-hover — use these to target generated markup */
export const WEIGHT_HOVER_CLASSES = {
	word: 'weight-hover-word',
	line: 'weight-hover-line',
	probe: 'weight-hover-probe',
} as const
