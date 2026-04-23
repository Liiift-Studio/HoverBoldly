// bold-lock/src/index.ts — public API exports
export {
	applyBoldLock,
	applyBoldShift,
	removeBoldShift,
	removeBoldLock,
	getCleanHTML,
	calcCompensation,
	getFontVariationSettings,
} from './core/adjust'
export { useBoldLock } from './react/useBoldLock'
export { BoldLockText } from './react/BoldLockText'
export type { BoldLockOptions, BoldShiftOptions, AxisConfig } from './core/types'
export { BOLD_LOCK_CLASSES } from './core/types'
