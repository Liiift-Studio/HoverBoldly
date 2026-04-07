"use client"

import { useState, useDeferredValue } from "react"
import { BoldLockText } from "@liiift-studio/hover-boldly"

const SAMPLE = `Hover over this paragraph to feel the weight change. The font grows heavier as your cursor moves over the text — but look carefully: the line endings stay exactly where they are. No word wraps to the next line. No layout shifts. The trick is measuring the width difference between the two weights using Canvas, then compensating with letter-spacing so the total advance width stays constant. Bold text normally pushes words around. This doesn't.`

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

	const dNormal = useDeferredValue(normalWeight)
	const dHover = useDeferredValue(hoverWeight)
	const dDuration = useDeferredValue(transitionDuration)

	const sampleStyle: React.CSSProperties = {
		fontFamily: "var(--font-merriweather), serif",
		fontSize: "1.125rem",
		lineHeight: "1.8",
	}

	return (
		<div className="w-full">
			<div className="grid grid-cols-3 gap-6 mb-8">
				<Slider label="Normal weight" value={normalWeight} min={100} max={500} step={100} onChange={setNormalWeight} />
				<Slider label="Hover weight" value={hoverWeight} min={400} max={900} step={100} onChange={setHoverWeight} />
				<Slider label="Duration (ms)" value={transitionDuration} min={0} max={500} step={25} onChange={setTransitionDuration} />
			</div>
			<BoldLockText normalWeight={dNormal} hoverWeight={dHover} transitionDuration={dDuration} style={sampleStyle}>
				{SAMPLE}
			</BoldLockText>
			<p className="text-xs opacity-50 italic mt-6">Move your cursor over the paragraph. Line endings stay fixed.</p>
		</div>
	)
}
