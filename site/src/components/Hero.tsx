// Shared hero for every Type Tools site — the ONE source of the hero convention so it can't drift
// per-tool (this is what previously let cedars/threadText miss the MagnetChar H1). Owns the
// drift-prone bits: the uppercase eyebrow, the MagnetChar-animated serif H1, the wrapping install
// row, and the tech-chip line. Each tool's lede prose + any extras are passed as `children`, so
// tool-specific content (cedars' ILT credit note, vfClamp's second paragraph, etc.) is preserved.
// Synced by sync-sites.mjs — edit here, not in a submodule. Requires @liiift-studio/magnettype.
import { Fragment, type ReactNode } from "react"
import { MagnetChar } from "@liiift-studio/magnettype"
import CopyInstall from "./CopyInstall"

/** One line of the hero H1. */
export interface HeroTitleLine {
	text: string
	/** Render italic (the family's second-line treatment). */
	italic?: boolean
	/** Use the subtle foreground colour (the family's second-line treatment). */
	subtle?: boolean
}

interface HeroProps {
	/** Small uppercase-tracked functional summary above the H1 — NOT the tool name (it's in the header). */
	eyebrow: string
	/** The big serif H1; one MagnetChar-animated line per entry (usually two). */
	title: HeroTitleLine[]
	/** Rest weight of the H1 letters (default 300). */
	titleWeight?: number
	/** npm package for the install snippet, e.g. "@liiift-studio/magnettype". */
	install: string
	/** GitHub repository URL. */
	github: string
	/** Tech-line chips, e.g. ["TypeScript", "Zero dependencies", "React + Vanilla JS"]. */
	tech: string[]
	/** Lede paragraph(s) and any tool-specific hero extras. */
	children?: ReactNode
}

/** Shared Type Tools hero. */
export default function Hero({ eyebrow, title, titleWeight = 300, install, github, tech, children }: HeroProps) {
	const magnet = { as: "span" as const, minWeight: titleWeight, maxWeight: 800, spreadRadius: 220, fixedAxes: { opsz: 144 } }
	return (
		<section aria-label="Introduction" className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<p className="text-xs uppercase tracking-[0.18em] font-medium text-muted">{eyebrow}</p>
				<h1 className="text-4xl lg:text-8xl xl:text-9xl" style={{ fontFamily: "var(--font-merriweather), serif", fontVariationSettings: `"wght" ${titleWeight}, "opsz" 144`, lineHeight: "1.05em" }}>
					{title.map((line, i) => {
						const style: React.CSSProperties = {}
						if (line.subtle) style.color = "var(--foreground-subtle)"
						if (line.italic) style.fontStyle = "italic"
						return (
							<Fragment key={i}>
								<MagnetChar {...magnet} style={Object.keys(style).length ? style : undefined}>{line.text}</MagnetChar>
								{i < title.length - 1 && <br />}
							</Fragment>
						)
					})}
				</h1>
			</div>
			<div className="flex flex-wrap items-center gap-4">
				<CopyInstall pkg={install} />
				<a href={github} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground transition-colors">GitHub ↗</a>
			</div>
			<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted tracking-wide">
				{tech.map((item, i) => (
					<Fragment key={i}>
						{i > 0 && <span aria-hidden="true">·</span>}
						<span>{item}</span>
					</Fragment>
				))}
			</div>
			{children}
		</section>
	)
}
