// bold-lock/src/index.ts — public API exports
export {
	applyBoldLock,
	applyBoldShift,
	removeBoldLock,
	getCleanHTML,
	calcCompensation,
	getFontVariationSettings,
} from './core/adjust'
export { useBoldLock } from './react/useBoldLock'
export { BoldLockText } from './react/BoldLockText'
export type { BoldLockOptions, BoldShiftOptions } from './core/types'
export { BOLD_LOCK_CLASSES } from './core/types'
