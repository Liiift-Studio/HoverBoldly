// hoverBoldly/src/framer/HoverBoldly.tsx — Framer code component wrapping the hoverBoldly core.
//
// Distribution: paste this file into Framer (Insert → Code → New Component), or host it as an
// ES module and add it by URL. It imports the framework-agnostic core straight from the CDN, so
// it needs no build step — the core function takes a DOM element, not React, so there is no
// React version/externalisation issue.
//
// The rendering logic mirrors the already-proven `useBoldLock` hook: applyBoldLock in an effect
// returns a cleanup closure that tears down its own listeners and restores markup/styles. Unlike
// a rAF tool there is no separate start function — applyBoldLock attaches the hover/pointer
// interaction and hands back the teardown. The only Framer-specific additions are the property
// controls, RenderTarget gating, and layout annotations.
import { useEffect, useRef } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"
// Pin to a published version so shared instances stay stable. Bump when the core changes.
// The core is framework-agnostic (operates on a DOM element), so no React externalisation is needed.
import { applyBoldLock } from "https://esm.sh/@liiift-studio/hoverboldly@1.1.16"

/** Props surfaced to the Framer UI via addPropertyControls, plus base text styling.
 *  Option fields are declared explicitly so the component needs no type import over HTTP. */
interface HoverBoldlyFramerProps {
	/** The text to bold on hover. */
	text: string
	/** CSS font-family — MUST resolve to a variable font exposing wght for the effect. */
	fontFamily: string
	/** Font size in px. */
	fontSize: number
	/** Text colour. */
	color: string
	/** Horizontal text alignment. */
	textAlign: "left" | "center" | "right"
	/** wght axis value at rest. */
	normalWeight: number
	/** wght axis value on hover. */
	hoverWeight: number
	/** Transition duration in milliseconds. */
	transitionDuration: number
	/** Interaction mode: whole element, per-word, or per-line cursor proximity. */
	mode: "element" | "word" | "proximity"
	/** Distance in px over which weight fades in proximity mode. */
	proximityThreshold: number
	/** Re-measure compensation on element resize (responsive typography). */
	resizeObserver: boolean
	/** Fake-slant skewX degrees on hover (0 disables). Negative = forward lean. */
	falseSlant: number
}

/**
 * Weight/bold hover without layout shift, as a Framer code component.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function HoverBoldly(props: Partial<HoverBoldlyFramerProps>) {
	const {
		text = "Hover to bold, no layout shift",
		fontFamily = "Roboto Flex",
		fontSize = 64,
		color = "#111111",
		textAlign = "left",
		normalWeight = 400,
		hoverWeight = 700,
		transitionDuration = 150,
		mode = "element",
		proximityThreshold = 120,
		resizeObserver = true,
		falseSlant = 0,
	} = props

	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const el = ref.current
		if (!el) return

		// Interactive on the live site and on the editing canvas (so the designer can hover it);
		// render inert static text on export / thumbnails where interaction is meaningless.
		const target = RenderTarget.current()
		const interactive = target === RenderTarget.preview || target === RenderTarget.canvas
		if (!interactive) return

		const options = {
			normalWeight,
			hoverWeight,
			transitionDuration,
			mode,
			proximityThreshold,
			resizeObserver,
			// falseSlant is an object option; expose only its hoverDeg, and disable at 0.
			...(falseSlant !== 0 ? { falseSlant: { hoverDeg: falseSlant } } : {}),
		}

		// applyBoldLock attaches the hover/pointer interaction and returns its own teardown,
		// which restores original markup (word/proximity modes) and inline styles (element mode).
		const cleanup = applyBoldLock(el, options)
		return cleanup
	}, [
		text,
		normalWeight,
		hoverWeight,
		transitionDuration,
		mode,
		proximityThreshold,
		resizeObserver,
		falseSlant,
	])

	return (
		<div
			ref={ref}
			style={{
				fontFamily,
				fontSize,
				color,
				textAlign,
				fontWeight: normalWeight,
				lineHeight: 1.1,
				width: "100%",
			}}
		>
			{text}
		</div>
	)
}

// Map every meaningful BoldLockOptions field to a Framer control.
// Omitted (cannot be a property control): `axes` — an arbitrary Record<string, AxisConfig> of
// extra OpenType axes keyed by tag; there is no Framer control for a free-form axis map. The
// `falseSlant.normalDeg` sub-field is also omitted (rest angle assumed 0); only `hoverDeg` is surfaced.
addPropertyControls(HoverBoldly, {
	text: {
		type: ControlType.String,
		title: "Text",
		defaultValue: "Hover to bold, no layout shift",
		displayTextArea: true,
	},
	fontFamily: {
		type: ControlType.String,
		title: "Font",
		defaultValue: "Roboto Flex",
		description: "Must be a variable font exposing the wght axis.",
	},
	fontSize: { type: ControlType.Number, title: "Size", defaultValue: 64, min: 8, max: 400, unit: "px" },
	color: { type: ControlType.Color, title: "Colour", defaultValue: "#111111" },
	textAlign: {
		type: ControlType.Enum,
		title: "Align",
		options: ["left", "center", "right"],
		optionTitles: ["Left", "Center", "Right"],
		defaultValue: "left",
		displaySegmentedControl: true,
	},
	normalWeight: { type: ControlType.Number, title: "Rest wght", defaultValue: 400, min: 1, max: 1000, step: 1 },
	hoverWeight: { type: ControlType.Number, title: "Hover wght", defaultValue: 700, min: 1, max: 1000, step: 1 },
	transitionDuration: {
		type: ControlType.Number,
		title: "Transition",
		defaultValue: 150,
		min: 0,
		max: 1000,
		step: 10,
		unit: "ms",
	},
	mode: {
		type: ControlType.Enum,
		title: "Mode",
		options: ["element", "word", "proximity"],
		optionTitles: ["Element", "Word", "Proximity"],
		defaultValue: "element",
	},
	proximityThreshold: {
		type: ControlType.Number,
		title: "Proximity",
		defaultValue: 120,
		min: 10,
		max: 600,
		step: 10,
		unit: "px",
		description: "Distance over which weight fades. Proximity mode only.",
	},
	resizeObserver: {
		type: ControlType.Boolean,
		title: "Resize obs.",
		defaultValue: true,
		enabledTitle: "On",
		disabledTitle: "Off",
	},
	falseSlant: {
		type: ControlType.Number,
		title: "False slant",
		defaultValue: 0,
		min: -30,
		max: 30,
		step: 1,
		unit: "°",
		description: "Fake skewX lean on hover. 0 disables. Negative = forward.",
	},
})
