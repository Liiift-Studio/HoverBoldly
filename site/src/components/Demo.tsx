// Demo.tsx — interactive bold-on-hover demo for hoverBoldly site
"use client"

import { useState, useEffect, useDeferredValue, useLayoutEffect, useRef, useCallback, useId } from "react"
import { calcCompensation } from "@liiift-studio/hoverboldly"

const SAMPLE = `Hover over this paragraph to feel the weight change. The font grows heavier as your cursor moves over the text — but look carefully: the line endings stay exactly where they are. No word wraps to the next line. No layout shifts. The trick is measuring the width difference between the two weights using Canvas, then compensating with letter-spacing so the total advance width stays constant. Bold text normally pushes words around. This doesn't.`

const WORDS = SAMPLE.split(' ')
const DEFAULT_WORD_IDX = Math.floor(WORDS.length / 2)

// Interval tick duration in ms for dwell progress increments
const DWELL_TICK_MS = 16

// Stable style object — hoisted to module scope to avoid recreation on every render
const SAMPLE_STYLE: React.CSSProperties = {
	fontFamily: "var(--font-merriweather), serif",
	fontSize: "1.125rem",
	lineHeight: "1.8",
	fontVariationSettings: '"wght" 300, "opsz" 18, "wdth" 100',
}

/** Slider control with accessible value readout */
function Slider({ label, value, min, max, step, onChange, description }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; description?: string }) {
	const descId = useId()
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs uppercase tracking-widest opacity-50">{label}</span>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				aria-label={label}
				aria-valuetext={String(value)}
				aria-describedby={description ? descId : undefined}
				onChange={e => onChange(Number(e.target.value))}
				onTouchStart={e => e.stopPropagation()}
				style={{ touchAction: 'none' }}
			/>
			{description && <span id={descId} className="sr-only">{description}</span>}
			<span className="tabular-nums text-xs opacity-50 text-right" aria-hidden="true">{value}</span>
		</div>
	)
}

/** Before/after toggle — left half = without effect, right half filled = with effect */
function BeforeAfterToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
	return (
		<button
			onClick={onClick}
			aria-label="Toggle before/after comparison"
			aria-pressed={active}
			title={active ? 'Hide comparison' : 'Compare without effect'}
			style={{
				position: 'absolute', bottom: 0, right: 0,
				width: 32, height: 32, borderRadius: '50%',
				border: '1px solid currentColor',
				opacity: active ? 0.8 : 0.25,
				background: 'transparent',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				cursor: 'pointer', transition: 'opacity 0.15s ease',
				// Ensure focus ring is not clipped by parent overflow: hidden
				outline: 'revert',
			}}
		>
			<svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
				<rect x="0.5" y="0.5" width="13" height="9" rx="1" stroke="currentColor" strokeWidth="1"/>
				<line x1="7" y1="0.5" x2="7" y2="9.5" stroke="currentColor" strokeWidth="1"/>
				<rect x="8" y="1.5" width="5" height="7" fill="currentColor"/>
			</svg>
		</button>
	)
}

/** DwellBar — isolated component so 60 Hz progress updates don't re-render the word list */
function DwellBar({ progress }: { progress: number }) {
	if (progress <= 0) return null
	return (
		<span
			aria-hidden="true"
			style={{
				position: 'absolute',
				bottom: 0,
				left: 0,
				width: `${progress * 100}%`,
				height: 2,
				background: 'currentColor',
				opacity: 0.6,
				pointerEvents: 'none',
				borderRadius: 1,
			}}
		/>
	)
}

export default function Demo() {
	const [normalWeight, setNormalWeight] = useState(300)
	const [hoverWeight, setHoverWeight] = useState(700)
	const [transitionDuration, setTransitionDuration] = useState(150)
	const [beforeAfter, setComparing] = useState(false)
	const [activeIdx, setActiveIdx] = useState<number>(DEFAULT_WORD_IDX)

	// Dwell mode state
	const [dwellMode, setDwellMode] = useState(false)
	const [dwellMs, setDwellMs] = useState(800)
	const [dwellProgress, setDwellProgress] = useState(0)

	// Tracks which word index is currently accumulating dwell progress
	const dwellWordIdxRef = useRef<number | null>(null)
	// Holds the dwell interval handle
	const dwellIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
	// Keep a ref to dwellMs so the interval always reads the current value
	const dwellMsRef = useRef(dwellMs)
	useEffect(() => { dwellMsRef.current = dwellMs }, [dwellMs])

	const hintId = useId()

	const dNormal = useDeferredValue(normalWeight)
	const dHover = useDeferredValue(hoverWeight)
	const dDuration = useDeferredValue(transitionDuration)

	// useRef initial value only matters on mount — use [] instead of a pre-filled array
	const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
	// Holds the pending timeout that resets the bold word after a touch interaction
	const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const [fontsReady, setFontsReady] = useState(false)
	useEffect(() => {
		document.fonts.ready.then(() => setFontsReady(true))
	}, [])

	// Clear touch reset timeout and dwell interval on unmount
	useEffect(() => () => {
		if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current)
		if (dwellIntervalRef.current) clearInterval(dwellIntervalRef.current)
	}, [])

	/** Cancel any running dwell interval and reset progress */
	const cancelDwell = useCallback(() => {
		if (dwellIntervalRef.current) {
			clearInterval(dwellIntervalRef.current)
			dwellIntervalRef.current = null
		}
		dwellWordIdxRef.current = null
		setDwellProgress(0)
	}, [])

	/** Start dwell timer for word at index i — reads live dwellMs via ref */
	const startDwell = useCallback((i: number) => {
		cancelDwell()
		dwellWordIdxRef.current = i
		const increment = DWELL_TICK_MS / dwellMsRef.current
		dwellIntervalRef.current = setInterval(() => {
			setDwellProgress(prev => {
				const next = prev + DWELL_TICK_MS / dwellMsRef.current
				if (next >= 1) {
					const handle = dwellIntervalRef.current
					if (handle) {
						clearInterval(handle)
						dwellIntervalRef.current = null
					}
					dwellWordIdxRef.current = null
					setActiveIdx(i)
					return 0
				}
				return next
			})
		}, DWELL_TICK_MS)
		// Suppress unused variable warning — increment is intentionally recalculated via ref
		void increment
	}, [cancelDwell])

	// Measure and lock each word's layout width at normal weight.
	// Fixed inline-block width prevents any reflow when a word goes bold.
	// Skip measurement until fonts are ready — widths measured before font load will be wrong.
	useLayoutEffect(() => {
		if (!fontsReady) return
		const refs = wordRefs.current

		refs.forEach(el => {
			if (!el) return
			el.style.display = 'inline'
			el.style.width = 'auto'
			el.style.fontVariationSettings = `'wght' ${dNormal}, 'opsz' 18, 'wdth' 100`
			el.style.letterSpacing = ''
			el.style.transition = 'none'
		})

		const widths = refs.map(el => el?.getBoundingClientRect().width ?? 0)

		refs.forEach((el, i) => {
			if (!el) return
			el.style.display = 'inline-block'
			el.style.verticalAlign = 'baseline'
			el.style.width = `${widths[i]}px`
		})
	}, [dNormal, fontsReady])

	// Apply bold to the active word before paint — no flash of uncompensated layout.
	useLayoutEffect(() => {
		wordRefs.current.forEach((el, i) => {
			if (!el) return
			el.style.transition = `font-variation-settings ${dDuration}ms ease, letter-spacing ${dDuration}ms ease`
			if (i === activeIdx) {
				const comp = calcCompensation(el, dNormal, dHover)
				const fontSize = parseFloat(getComputedStyle(el).fontSize)
				const compEm = fontSize > 0 ? comp / fontSize : 0
				el.style.fontVariationSettings = `'wght' ${dHover}, 'opsz' 18, 'wdth' 100`
				el.style.letterSpacing = `${compEm}em`
			} else {
				el.style.fontVariationSettings = `'wght' ${dNormal}, 'opsz' 18, 'wdth' 100`
				el.style.letterSpacing = ''
			}
		})
	}, [activeIdx, dNormal, dHover, dDuration])

	// Keep normalWeight clamped below hoverWeight to avoid weight inversion
	const clampedNormalMax = Math.min(500, hoverWeight - 100)
	const clampedHoverMin = Math.max(400, normalWeight + 100)

	const handleNormalWeightChange = useCallback((v: number) => {
		setNormalWeight(Math.min(v, hoverWeight - 100))
	}, [hoverWeight])

	const handleHoverWeightChange = useCallback((v: number) => {
		setHoverWeight(Math.max(v, normalWeight + 100))
	}, [normalWeight])

	// Determine which word (if any) is currently accumulating dwell progress
	const dwellingIdx = dwellWordIdxRef.current

	// Stable event handlers for the word list to avoid recreating ~231 closures per render
	const handleParaMouseLeave = useCallback(() => {
		if (dwellMode) cancelDwell()
		setActiveIdx(DEFAULT_WORD_IDX)
	}, [dwellMode, cancelDwell])

	return (
		<div className="w-full">
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
				<Slider
					label="Normal weight"
					value={normalWeight}
					min={300}
					max={clampedNormalMax}
					step={100}
					onChange={handleNormalWeightChange}
					description="Font weight when the cursor is not hovering over a word"
				/>
				<Slider
					label="Hover weight"
					value={hoverWeight}
					min={clampedHoverMin}
					max={900}
					step={100}
					onChange={handleHoverWeightChange}
					description="Font weight applied to the word under the cursor — higher values produce heavier, bolder text"
				/>
				<Slider
					label="Duration (ms)"
					value={transitionDuration}
					min={0}
					max={500}
					step={25}
					onChange={setTransitionDuration}
					description="How long the weight transition takes in milliseconds"
				/>
			</div>
			<div className="flex items-center gap-4 mb-6">
				<button
					onClick={() => {
						cancelDwell()
						setDwellMode(v => !v)
					}}
					aria-label="Toggle gaze dwell mode"
					aria-pressed={dwellMode}
					title={dwellMode ? 'Disable dwell mode — words bold instantly on hover' : 'Enable dwell mode — a word only bolds after the cursor has hovered over it for the set dwell duration'}
					style={{
						padding: '4px 12px',
						borderRadius: 4,
						border: '1px solid currentColor',
						opacity: dwellMode ? 0.8 : 0.3,
						background: 'transparent',
						cursor: 'pointer',
						fontSize: '0.75rem',
						letterSpacing: '0.1em',
						textTransform: 'uppercase',
						transition: 'opacity 0.15s ease',
					}}
				>
					Dwell
				</button>
				{dwellMode && (
					<div style={{ flex: 1, maxWidth: 220 }}>
						<Slider
							label="Dwell (ms)"
							value={dwellMs}
							min={200}
							max={2000}
							step={100}
							onChange={setDwellMs}
							description="How long the cursor must hover over a word before it bolds"
						/>
					</div>
				)}
			</div>
			<div className="relative pb-8">
				<p
					role="group"
					aria-label="Interactive demo — hover or tap each word to bold it"
					aria-describedby={hintId}
					style={{ ...SAMPLE_STYLE, overflow: 'hidden' }}
					onMouseLeave={handleParaMouseLeave}
				>
					{WORDS.map((word, i) => {
						// Show dwell progress bar on the word currently being dwelled on
						const isDwelling = dwellMode && dwellingIdx === i && dwellProgress > 0
						return (
							<span
								key={i}
								ref={el => { wordRefs.current[i] = el }}
								tabIndex={0}
								role="button"
								aria-label={word}
								style={{ position: 'relative' }}
								onMouseEnter={() => {
									if (dwellMode) {
										startDwell(i)
									} else {
										setActiveIdx(i)
									}
								}}
								onMouseLeave={() => {
									if (dwellMode) {
										cancelDwell()
									}
								}}
								onFocus={() => setActiveIdx(i)}
								onBlur={() => setActiveIdx(DEFAULT_WORD_IDX)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault()
										setActiveIdx(i)
									}
								}}
								onTouchStart={() => {
									setActiveIdx(i)
									if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current)
									touchTimeoutRef.current = setTimeout(() => {
										setActiveIdx(DEFAULT_WORD_IDX)
									}, 2000)
								}}
							>
								{word}
								{isDwelling && <DwellBar progress={dwellProgress} />}
							</span>
						)
					}).reduce<React.ReactNode[]>((acc, span, i) => {
						acc.push(span)
						if (i < WORDS.length - 1) acc.push(' ')
						return acc
					}, [])}
				</p>
				{beforeAfter && (
					<p aria-hidden="true" style={{ ...SAMPLE_STYLE, position: 'absolute', top: 0, left: 0, width: '100%', margin: 0, opacity: 0.25, pointerEvents: 'none' }}>{SAMPLE}</p>
				)}
				<BeforeAfterToggle active={beforeAfter} onClick={() => setComparing(v => !v)} />
			</div>
			<p id={hintId} className="text-xs opacity-50 italic mt-8" style={{ lineHeight: "1.8" }}>
				{dwellMode
					? `Gaze dwell mode — hover a word for ${dwellMs}ms to bold it. A progress bar shows fill beneath the word.`
					: 'Move your cursor over any word to bold it, or tap on mobile. Line endings stay fixed regardless of weight. On mobile, the bold resets after 2 seconds.'
				}
			</p>
		</div>
	)
}
