import Demo from "@/components/Demo"
import CopyInstall from "@/components/CopyInstall"
import CodeBlock from "@/components/CodeBlock"
import { version } from "../../../package.json"

export default function Home() {
	return (
		<main className="flex flex-col items-center px-6 py-20 gap-24">

			{/* Hero */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<p className="text-xs uppercase tracking-widest opacity-50">weight-hover</p>
					<h1 className="text-4xl lg:text-8xl xl:text-9xl" style={{ fontFamily: "var(--font-merriweather), serif", fontVariationSettings: '"wght" 700', lineHeight: "1.05em" }}>
						Bold on hover.<br />
						<span style={{ opacity: 0.5, fontVariationSettings: '"wght" 300', fontStyle: "italic" }}>Zero layout shift.</span>
					</h1>
				</div>
				<div className="flex items-center gap-4">
					<CopyInstall />
					<a href="https://github.com/quitequinn/weight-hover" target="_blank" rel="noopener noreferrer" className="text-sm opacity-50 hover:opacity-100 transition-opacity">GitHub ↗</a>
				</div>
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-50 tracking-wide">
					<span>TypeScript</span><span>·</span><span>Canvas measurement</span><span>·</span><span>React + Vanilla JS</span>
				</div>
				<p className="text-base opacity-60 leading-relaxed max-w-lg">
					Every browser will reflow text when you hover to bold — words push down, lines shift. Weight Hover measures the exact width difference using Canvas, then compensates with letter-spacing so the line never moves.
				</p>
			</section>

			{/* Demo */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-4">
				<p className="text-xs uppercase tracking-widest opacity-50">Live demo — hover the paragraph</p>
				<div className="rounded-xl -mx-8 px-8 py-8" style={{ background: "rgba(0,0,0,0.25)" }}>
					<Demo />
				</div>
			</section>

			{/* Explanation */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<p className="text-xs uppercase tracking-widest opacity-50">The problem with bold hover</p>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-sm leading-relaxed opacity-70">
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">Why text reflows</p>
						<p>Bold glyphs are wider. When you change font-weight on hover, every character in the element grows slightly, words push into the next line, and the whole paragraph reflts. It&apos;s jarring and there&apos;s no CSS fix.</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold opacity-100 text-base">How we fix it</p>
						<p>Canvas measureText gives us the exact advance width of each line at both weights. The difference becomes a negative letter-spacing compensation applied on hover, so total line width stays identical. One measurement pass on mount, zero reflow on hover.</p>
					</div>
				</div>
			</section>

			{/* Usage */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex items-baseline gap-4">
					<p className="text-xs uppercase tracking-widest opacity-50">Usage</p>
				</div>
				<div className="flex flex-col gap-8 text-sm">
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Drop-in component</p>
						<CodeBlock code={`import { WeightHoverText } from '@liiift-studio/weight-hover'

<WeightHoverText normalWeight={300} hoverWeight={700} transitionDuration={150}>
  Hover over this text...
</WeightHoverText>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Hook</p>
						<CodeBlock code={`import { useWeightHover } from '@liiift-studio/weight-hover'

const ref = useWeightHover({ normalWeight: 300, hoverWeight: 700 })
<p ref={ref}>{children}</p>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="opacity-50">Options</p>
						<table className="w-full text-xs">
							<thead><tr className="opacity-50 text-left"><th className="pb-2 pr-6 font-normal">Option</th><th className="pb-2 pr-6 font-normal">Default</th><th className="pb-2 font-normal">Description</th></tr></thead>
							<tbody className="opacity-70">
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">normalWeight</td><td className="py-2 pr-6">computed</td><td className="py-2">Font weight at rest.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">hoverWeight</td><td className="py-2 pr-6">700</td><td className="py-2">Font weight on hover.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">transitionDuration</td><td className="py-2 pr-6">150</td><td className="py-2">Transition duration in milliseconds.</td></tr>
								<tr className="border-t border-white/10 hover:bg-white/5 transition-colors"><td className="py-2 pr-6 font-mono">mode</td><td className="py-2 pr-6">&apos;element&apos;</td><td className="py-2">&apos;element&apos; = whole element hovers together, &apos;word&apos; = individual word hover.</td></tr>
							</tbody>
						</table>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="w-full max-w-2xl lg:max-w-5xl flex justify-between text-xs opacity-50 pt-8 border-t border-white/10">
				<span>weight-hover v{version}</span>
				<a href="https://liiift.studio" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Liiift Studio</a>
			</footer>

		</main>
	)
}
