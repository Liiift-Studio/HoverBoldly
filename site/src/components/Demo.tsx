"use client"

import { useState, useEffect, useDeferredValue, useLayoutEffect, useRef } from "react"
import { calcCompensation } from "@liiift-studio/hoverboldly"

const SAMPLE = `Hover over this paragraph to feel the weight change. The font grows heavier as your cursor moves over the text — but look carefully: the line endings stay exactly where they are. No word wraps to the next line. No layout shifts. The trick is measuring the width difference between the two weights using Canvas, then compensating with letter-spacing so the total advance width stays constant. Bold text normally pushes words around. This doesn't.`

const WORDS = SAMPLE.split(' ')
const DEFAULT_WORD_IDX = Math.floor(WORDS.length / 2)

// Interval tick duration in ms for dwell progress increments
const DWELL_TICK_MS = 16

function Slider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs uppercase tracking-widest opacity-50">{label}</span>
			<input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={e => onChange(Number(e.target.value))} onTouchStart={e => e.stopPropagation()} style={{ touchAction: 'none' }} />
			<span className="tabular-nums text-xs opacity-50 text-right">{value}</span>
		</div>
	)
}

/** Before/after toggle — left half = without effect, right half filled = with effect */
function BeforeAfterToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
	return (
		<button
			onClick={onClick}
			aria-label="Toggle before/after comparison"
			title={active ? 'Hide comparison' : 'Compare without effect'}
			style={{
				position: 'absolute', bottom: 0, right: 0,
				width: 32, height: 32, borderRadius: '50%',
				border: '1px solid currentColor',
				opacity: active ? 0.8 : 0.25,
				background: 'transparent',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				cursor: 'pointer', transition: 'opacity 0.15s ease',
			}}
		>
			<svg width="14" height="10" viewBox="0 0 14 10" fill="none">
				<rect x="0.5" y="0.5" width="13" height="9" rx="1" stroke="currentColor" strokeWidth="1"/>
				<line x1="7" y1="0.5" x2="7" y2="9.5" stroke="currentColor" strokeWidth="1"/>
				<rect x="8" y="1.5" width="5" height="7" fill="currentColor"/>
			</svg>
		</button>
	)
}

export default function Demo() {
	const [normalWeight, setNormalWeight] = useState(300)
	const [hoverWeight, setHoverWeight] = useState(800)
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

	const dNormal = useDeferredValue(normalWeight)
	const dHover = useDeferredValue(hoverWeight)
	const dDuration = useDeferredValue(transitionDuration)

	const wordRefs = useRef<(HTMLSpanElement | null)[]>(Array(WORDS.length).fill(null))
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
	function cancelDwell() {
		if (dwellIntervalRef.current) {
			clearInterval(dwellIntervalRef.current)
			dwellIntervalRef.current = null
		}
		dwellWordIdxRef.current = null
		setDwellProgress(0)
	}

	/** Start dwell timer for word at index i */
	function startDwell(i: number, currentDwellMs: number) {
		cancelDwell()
		dwellWordIdxRef.current = i
		const increment = DWELL_TICK_MS / currentDwellMs
		dwellIntervalRef.current = setInterval(() => {
			setDwellProgress(prev => {
				const next = prev + increment
				if (next >= 1) {
					// Dwell complete — activate word and reset
					clearInterval(dwellIntervalRef.current!)
					dwellIntervalRef.current = null
					dwellWordIdxRef.current = null
					setActiveIdx(i)
					return 0
				}
				return next
			})
		}, DWELL_TICK_MS)
	}

	const sampleStyle: React.CSSProperties = {
		fontFamily: "var(--font-merriweather), serif",
		fontSize: "1.125rem",
		lineHeight: "1.8",
		fontVariationSettings: '"wght" 300, "opsz" 18, "wdth" 100',
	}

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

	// Determine which word (if any) is currently accumulating dwell progress
	const dwellingIdx = dwellWordIdxRef.current

	return (
		<div className="w-full">
			<div className="grid grid-cols-3 gap-6 mb-8">
				<Slider label="Normal weight" value={normalWeight} min={300} max={500} step={100} onChange={setNormalWeight} />
				<Slider label="Hover weight" value={hoverWeight} min={400} max={900} step={100} onChange={setHoverWeight} />
				<Slider label="Duration (ms)" value={transitionDuration} min={0} max={500} step={25} onChange={setTransitionDuration} />
			</div>
			<div className="flex items-center gap-4 mb-6">
				<button
					onClick={() => {
						cancelDwell()
						setDwellMode(v => !v)
					}}
					aria-label="Toggle gaze dwell mode"
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
						<Slider label="Dwell (ms)" value={dwellMs} min={200} max={2000} step={100} onChange={setDwellMs} />
					</div>
				)}
			</div>
			<div className="relative pb-8">
				<p
					style={{ ...sampleStyle, overflow: 'hidden' }}
					onMouseLeave={() => {
						if (dwellMode) {
							cancelDwell()
						}
						setActiveIdx(DEFAULT_WORD_IDX)
					}}
				>
					{WORDS.map((word, i) => {
						// Show dwell progress bar on the word currently being dwelled on
						const isDwelling = dwellMode && dwellingIdx === i && dwellProgress > 0
						return (
							<span
								key={i}
								ref={el => { wordRefs.current[i] = el }}
								style={{ position: 'relative' }}
								onMouseEnter={() => {
									if (dwellMode) {
										startDwell(i, dwellMs)
									} else {
										setActiveIdx(i)
									}
								}}
								onMouseLeave={() => {
									if (dwellMode) {
										cancelDwell()
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
								{isDwelling && (
									<span
										aria-hidden
										style={{
											position: 'absolute',
											bottom: 0,
											left: 0,
											width: `${dwellProgress * 100}%`,
											height: 2,
											background: 'currentColor',
											opacity: 0.6,
											pointerEvents: 'none',
											borderRadius: 1,
										}}
									/>
								)}
							</span>
						)
					}).reduce<React.ReactNode[]>((acc, span, i) => {
						acc.push(span)
						if (i < WORDS.length - 1) acc.push(' ')
						return acc
					}, [])}
				</p>
				{beforeAfter && (
					<p aria-hidden style={{ ...sampleStyle, position: 'absolute', top: 0, left: 0, width: '100%', margin: 0, opacity: 0.25, pointerEvents: 'none' }}>{SAMPLE}</p>
				)}
				<BeforeAfterToggle active={beforeAfter} onClick={() => setComparing(v => !v)} />
			</div>
			<p className="text-xs opacity-50 italic mt-8" style={{ lineHeight: "1.8" }}>
				{dwellMode
					? `Gaze dwell mode — hover a word for ${dwellMs}ms to bold it. A progress bar shows fill beneath the word.`
					: 'Move your cursor — or tap on mobile — to bold any word. Line endings stay fixed regardless of weight. On mobile, the bold resets after 2 seconds.'
				}
			</p>
		</div>
	)
}
