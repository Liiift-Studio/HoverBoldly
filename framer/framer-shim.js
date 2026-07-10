// hoverBoldly/framer/framer-shim.js — minimal stand-in for the "framer" module so a Framer
// code component can run in a plain browser (no Framer account). It reproduces just the API
// surface our components touch: addPropertyControls (no-op), ControlType (string stubs), and
// RenderTarget (reports 'preview' so the animated branch runs, matching a live Framer site).

/** No-op: in Framer this registers the property-control schema; irrelevant when rendering directly. */
export function addPropertyControls() {}

/** ControlType.X → the string "X". Enough for schema objects to be constructed without error. */
export const ControlType = new Proxy({}, { get: (_t, key) => String(key) })

/** RenderTarget.current() returns 'preview' so components take their live/animated path. */
export const RenderTarget = {
	canvas: "canvas",
	export: "export",
	thumbnail: "thumbnail",
	preview: "preview",
	current: () => "preview",
}
