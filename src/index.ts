// weight-hover/src/index.ts — public API exports
export {
	applyWeightHover,
	applyBoldShift,
	removeWeightHover,
	getCleanHTML,
	calcCompensation,
	getFontVariationSettings,
} from './core/adjust'
export { useWeightHover } from './react/useWeightHover'
export { WeightHoverText } from './react/WeightHoverText'
export type { WeightHoverOptions, BoldShiftOptions } from './core/types'
export { WEIGHT_HOVER_CLASSES } from './core/types'
