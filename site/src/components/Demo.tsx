"use client"

import { useState, useDeferredValue, useEffect, useRef } from "react"
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

export default function Demo() {
	const [normalWeight, setNormalWeight] = useState(300)
	const [hoverWeight, setHoverWeight] = useState(700)
	const [transitionDuration, setTransitionDuration] = useState(150)
	const [comparing, setComparing] = useState(false)
	const [activeIdx, setActiveIdx] = useState<number>(DEFAULT_WORD_IDX)

	const dNormal = useDeferredValue(normalWeight)
	const dHover = useDeferredValue(hoverWeight)
	const dDuration = useDeferredValue(transitionDuration)

	const wordRefs = useRef<(HTMLSpanElement | null)[]>(Array(WORDS.length).fill(null))

	const sampleStyle: React.CSSProperties = {
		fontFamily: "var(--font-merriweather), serif",
		fontSize: "1.125rem",
		lineHeight: "1.8",
	}

	// Apply bold state to the active word and normal state to all others
	useEffect(() => {
		wordRefs.current.forEach((el, i) => {
			if (!el) return
			if (i === activeIdx) {
				const comp = calcCompensation(el, dNormal, dHover)
				const fontSize = parseFloat(getComputedStyle(el).fontSize)
				const compEm = fontSize > 0 ? comp / fontSize : 0
				el.style.transition = `font-variation-settings ${dDuration}ms ease, letter-spacing ${dDuration}ms ease`
				el.style.fontVariationSettings = `'wght' ${dHover}`
				el.style.letterSpacing = `${compEm}em`
			} else {
				el.style.transition = `font-variation-settings ${dDuration}ms ease, letter-spacing ${dDuration}ms ease`
				el.style.fontVariationSettings = `'wght' ${dNormal}`
				el.style.letterSpacing = ''
			}
		})
	}, [activeIdx, dNormal, dHover, dDuration])

	return (
		<div className="w-full">
			<div className="grid grid-cols-3 gap-6 mb-6">
				<Slider label="Normal weight" value={normalWeight} min={100} max={500} step={100} onChange={setNormalWeight} />
				<Slider label="Hover weight" value={hoverWeight} min={400} max={900} step={100} onChange={setHoverWeight} />
				<Slider label="Duration (ms)" value={transitionDuration} min={0} max={500} step={25} onChange={setTransitionDuration} />
			</div>
			<div className="flex flex-wrap items-center gap-3 mb-8">
				<span className="text-xs uppercase tracking-widest opacity-50">Compare</span>
				<button onClick={() => setComparing(v => !v)} className="text-xs px-3 py-1 rounded-full border transition-opacity" style={{ borderColor: 'currentColor', opacity: comparing ? 1 : 0.5, background: comparing ? 'var(--btn-bg)' : 'transparent' }}>without</button>
			</div>
			<div className="relative">
				<p
					style={sampleStyle}
					onMouseLeave={() => setActiveIdx(DEFAULT_WORD_IDX)}
				>
					{WORDS.map((word, i) => (
						<span
							key={i}
							ref={el => { wordRefs.current[i] = el }}
							style={{ display: 'inline', fontVariationSettings: `'wght' ${dNormal}` }}
							onMouseEnter={() => setActiveIdx(i)}
							onTouchStart={() => setActiveIdx(i)}
						>
							{word}{i < WORDS.length - 1 ? ' ' : ''}
						</span>
					))}
				</p>
				{comparing && (
					<p aria-hidden style={{ ...sampleStyle, position: 'absolute', top: 0, left: 0, width: '100%', margin: 0, opacity: 0.25, pointerEvents: 'none' }}>{SAMPLE}</p>
				)}
			</div>
			<p className="text-xs opacity-50 italic mt-6">One word is bold by default. Move your cursor — or tap on mobile — to target any word. Line endings stay fixed.</p>
		</div>
	)
}
