"use client"

import { useState, useEffect, useDeferredValue, useLayoutEffect, useRef } from "react"
import { calcCompensation } from "@liiift-studio/hoverboldly"

const SAMPLE = `Hover over this paragraph to feel the weight change. The font grows heavier as your cursor moves over the text — but look carefully: the line endings stay exactly where they are. No word wraps to the next line. No layout shifts. The trick is measuring the width difference between the two weights using Canvas, then compensating with letter-spacing so the total advance width stays constant. Bold text normally pushes words around. This doesn't.`

const WORDS = SAMPLE.split(' ')
const DEFAULT_WORD_IDX = Math.floor(WORDS.length / 2)

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
	const [hoverWeight, setHoverWeight] = useState(700)
	const [transitionDuration, setTransitionDuration] = useState(150)
	const [beforeAfter, setComparing] = useState(false)
	const [activeIdx, setActiveIdx] = useState<number>(DEFAULT_WORD_IDX)

	const dNormal = useDeferredValue(normalWeight)
	const dHover = useDeferredValue(hoverWeight)
	const dDuration = useDeferredValue(transitionDuration)

	const wordRefs = useRef<(HTMLSpanElement | null)[]>(Array(WORDS.length).fill(null))

	const [fontsReady, setFontsReady] = useState(false)
	useEffect(() => {
		document.fonts.ready.then(() => setFontsReady(true))
	}, [])

	const sampleStyle: React.CSSProperties = {
		fontFamily: "var(--font-merriweather), serif",
		fontSize: "1.125rem",
		lineHeight: "1.8",
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
			el.style.fontVariationSettings = `'wght' ${dNormal}`
			el.style.letterSpacing = ''
			el.style.transition = 'none'
		})

		const widths = refs.map(el => el?.getBoundingClientRect().width ?? 0)

		refs.forEach((el, i) => {
			if (!el) return
			el.style.display = 'inline-block'
			el.style.verticalAlign = 'baseline'
			el.style.overflow = 'hidden'
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
				el.style.fontVariationSettings = `'wght' ${dHover}`
				el.style.letterSpacing = `${compEm}em`
			} else {
				el.style.fontVariationSettings = `'wght' ${dNormal}`
				el.style.letterSpacing = ''
			}
		})
	}, [activeIdx, dNormal, dHover, dDuration])

	return (
		<div className="w-full" style={{ overflow: 'hidden' }}>
			<div className="grid grid-cols-3 gap-6 mb-8">
				<Slider label="Normal weight" value={normalWeight} min={100} max={500} step={100} onChange={setNormalWeight} />
				<Slider label="Hover weight" value={hoverWeight} min={400} max={900} step={100} onChange={setHoverWeight} />
				<Slider label="Duration (ms)" value={transitionDuration} min={0} max={500} step={25} onChange={setTransitionDuration} />
			</div>
			<div className="relative pb-8">
				<p
					style={{ ...sampleStyle, overflowWrap: 'break-word' }}
					onMouseLeave={() => setActiveIdx(DEFAULT_WORD_IDX)}
				>
					{WORDS.map((word, i) => (
						<span
							key={i}
							ref={el => { wordRefs.current[i] = el }}
							onMouseEnter={() => setActiveIdx(i)}
							onTouchStart={() => setActiveIdx(i)}
						>
							{word}
						</span>
					)).reduce<React.ReactNode[]>((acc, span, i) => {
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
			<p className="text-xs opacity-50 italic mt-6">One word is bold by default. Move your cursor — or tap on mobile — to target any word. Line endings stay fixed.</p>
		</div>
	)
}
