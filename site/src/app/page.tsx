// page.tsx — hoverBoldly landing page
import Demo from "@/components/Demo"
import CopyInstall from "@/components/CopyInstall"
import CodeBlock from "@/components/CodeBlock"
import ToolDirectory from "@/components/ToolDirectory"
import { version } from "../../../package.json"
import { version as siteVersion } from "../../package.json"
import SiteFooter from "../components/SiteFooter"
import PortsSection from "../components/PortsSection"
import { MagnetChar } from "@liiift-studio/magnettype"

export default function Home() {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"name": "Hover Boldly",
		"url": "https://hoverboldly.com",
		"description": "Bold on hover without layout shift. Measures the width difference between normal and bold weight using Canvas, then compensates with letter-spacing. Zero reflow.",
		"applicationCategory": "DeveloperApplication",
		"operatingSystem": "Any",
		"offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
	}

	return (
		<main className="flex flex-col items-center px-6 py-20 gap-24">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>

			{/* Hero */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<p className="text-xs uppercase tracking-[0.18em] font-medium text-muted">hoverboldly</p>
					<h1 className="text-4xl lg:text-8xl xl:text-9xl" style={{ fontFamily: "var(--font-merriweather), serif", fontVariationSettings: '"wght" 300, "opsz" 144', lineHeight: "1.05em" }}>
						<MagnetChar as="span" minWeight={300} maxWeight={800} spreadRadius={220} fixedAxes={{ opsz: 144 }}>Bold on hover,</MagnetChar><br />
						<MagnetChar as="span" minWeight={300} maxWeight={800} spreadRadius={220} fixedAxes={{ opsz: 144 }} style={{ color: "var(--foreground-subtle)", fontStyle: "italic" }}>Zero layout shift.</MagnetChar>
					</h1>
				</div>
				<div className="flex items-center gap-4">
					<CopyInstall />
					<a href="https://github.com/Liiift-Studio/HoverBoldly" className="text-sm text-muted hover:text-foreground transition-colors">GitHub</a>
				</div>
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted tracking-wide">
					<span>TypeScript</span><span>·</span><span>Canvas measurement</span><span>·</span><span>React + Vanilla JS</span>
				</div>
				<p className="text-base leading-relaxed max-w-lg">
					Every browser will reflow text when you hover to bold — words push down, lines shift. Hover Boldly measures the exact width difference using Canvas, then compensates with letter-spacing so the line never moves.
				</p>
			</section>

			{/* Demo */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-4">
				<h2 className="text-xs uppercase tracking-[0.18em] font-medium text-muted">Live demo — hover or tap the paragraph</h2>
				<div className="rounded-xl -mx-8 px-8 py-8" style={{ background: "var(--panel)", overflow: 'hidden' }}>
					<Demo />
				</div>
			</section>

			{/* Explanation */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<h2 className="text-xs uppercase tracking-[0.18em] font-medium text-muted">The problem with bold hover</h2>
				<div className="prose-grid grid grid-cols-1 sm:grid-cols-2 gap-12 text-sm leading-relaxed">
					<div className="flex flex-col gap-3">
						<p className="font-semibold text-foreground text-base">Why text reflows</p>
						<p>Bold glyphs are wider. When you change font-weight on hover, every character in the element grows slightly, words push into the next line, and the whole paragraph reflts. It&rsquo;s jarring and there&rsquo;s no CSS fix.</p>
					</div>
					<div className="flex flex-col gap-3">
						<p className="font-semibold text-foreground text-base">How we fix it</p>
						<p>Canvas measureText gives us the exact advance width of each line at both weights. The difference becomes a negative letter-spacing compensation applied on hover, so total line width stays identical. One measurement pass on mount, zero reflow on hover.</p>
					</div>
				</div>
			</section>

			{/* Usage */}
			<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
				<div className="flex items-baseline gap-4">
					<h2 className="text-xs uppercase tracking-[0.18em] font-medium text-muted">Usage</h2>
				</div>
				<div className="flex flex-col gap-8 text-sm">
					<div className="flex flex-col gap-3">
						<p className="text-muted">Drop-in component</p>
						<CodeBlock code={`import { BoldLockText } from '@liiift-studio/hoverboldly'

<BoldLockText
  normalWeight={300}
  hoverWeight={700}
  mode="word"
>
  Hover over this text...
</BoldLockText>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="text-muted">Hook</p>
						<CodeBlock code={`import { useBoldLock } from '@liiift-studio/hoverboldly'

const ref = useBoldLock({ normalWeight: 300, hoverWeight: 700 })
<p ref={ref}>{children}</p>`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="text-muted">Vanilla JS</p>
						<CodeBlock code={`import { applyBoldLock } from '@liiift-studio/hoverboldly'

const el = document.querySelector('p')
const cleanup = applyBoldLock(el, { normalWeight: 300, hoverWeight: 700 })

// Later — removes listeners, resets styles, and in word/proximity modes
// also restores element.innerHTML to its original state:
cleanup()`} />
					</div>
					<div className="flex flex-col gap-3">
						<p className="text-muted">Options</p>
						<table className="w-full text-xs" aria-label="BoldLock API options">
							<thead>
								<tr className="text-subtle text-left">
									<th className="pb-2 pr-6 font-normal">Option</th>
									<th className="pb-2 pr-6 font-normal">Default</th>
									<th className="pb-2 font-normal">Description</th>
								</tr>
							</thead>
							<tbody className="text-muted">
								<tr className="border-t border-foreground/10 hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">normalWeight</td><td className="py-2 pr-6">computed</td><td className="py-2">Font weight at rest.</td></tr>
								<tr className="border-t border-foreground/10 hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">hoverWeight</td><td className="py-2 pr-6">700</td><td className="py-2">Font weight on hover.</td></tr>
								<tr className="border-t border-foreground/10 hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">transitionDuration</td><td className="py-2 pr-6">150</td><td className="py-2">Transition duration in milliseconds.</td></tr>
								<tr className="border-t border-foreground/10 hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">mode</td><td className="py-2 pr-6">&apos;element&apos;</td><td className="py-2">&apos;element&apos; = whole element bolds on hover. &apos;word&apos; = individual word hover targets. &apos;proximity&apos; = weight increases per line based on cursor distance, fading with distance.</td></tr>
								<tr className="border-t border-foreground/10 hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">proximityThreshold</td><td className="py-2 pr-6">120</td><td className="py-2">Distance in px from a line&apos;s centre over which weight fades. Only used in &apos;proximity&apos; mode.</td></tr>
								<tr className="border-t border-foreground/10 hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">resizeObserver</td><td className="py-2 pr-6">true</td><td className="py-2">Re-measure compensation when the element&apos;s size changes (e.g. responsive font-size).</td></tr>
								<tr className="border-t border-foreground/10 hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">axes</td><td className="py-2 pr-6">—</td><td className="py-2">Additional variable font axes to drive on hover (e.g. slnt, wdth). Each key is an OpenType axis tag with normal/hover values.</td></tr>
								<tr className="border-t border-foreground/10 hover:bg-foreground/5 transition-colors"><td className="py-2 pr-6 font-mono">falseSlant</td><td className="py-2 pr-6">—</td><td className="py-2">Fake italic via CSS skewX() for fonts without a slnt axis. Provide <code>hoverDeg</code> (and optionally <code>normalDeg</code>).</td></tr>
							</tbody>
						</table>
					</div>
				</div>
			</section>

			<PortsSection
				npm="@liiift-studio/hoverboldly"
				bundle="hoverboldly"
				attr="data-hoverboldly" figma="frozen"
				framerComponent="HoverBoldly"
				repo="Liiift-Studio/HoverBoldly"
			/>

			<SiteFooter current="hoverBoldly" npmVersion={version} siteVersion={siteVersion} />

		</main>
	)
}
