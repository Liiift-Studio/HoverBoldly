// PortsSection.tsx — "Use it anywhere" block surfacing a tool's no-code ports: Webflow embed,
// Framer code component, and the Figma plugin. Synced to every tool site from
// type-tools/shared/components/. Presentational: each page passes its own tool's port identifiers,
// and every block is optional, so a tool can ship any combination (e.g. Figma-only).
import CodeBlock from "./CodeBlock"

/** Figma fidelity for this tool, mirroring the plugin's badge. Omit when the tool has no Figma port. */
type FigmaFidelity = "full" | "partial" | "frozen"

interface PortsSectionProps {
	/** npm package name for the Webflow embed, e.g. "@liiift-studio/floodtext". Omit if no Webflow port. */
	npm?: string
	/** Webflow bundle basename — served at dist/<bundle>.webflow.min.js, e.g. "floodtext". */
	bundle?: string
	/** Opt-in data attribute for the Webflow embed, e.g. "data-floodtext". */
	attr?: string
	/** Framer code component name, e.g. "FloodText". Omit when the tool has no Framer port. */
	framerComponent?: string
	/** GitHub "org/repo" used to link the Framer component source, e.g. "Liiift-Studio/FloodText". */
	repo?: string
	/** Figma fidelity ("full" | "partial" | "frozen"). Omit when the tool isn't in the Figma plugin. */
	figma?: FigmaFidelity
}

/** One-line explanation of what each Figma fidelity tier means for this tool. */
const FIGMA_NOTE: Record<FigmaFidelity, string> = {
	full: "ports faithfully as a canvas operation",
	partial: "works with compromises — tracking or named-instance swaps (Figma can't set variable axes)",
	frozen: "bakes a single static frame of the animated effect (no live animation in Figma)",
}

/** URL of the aggregator Figma plugin (one plugin hosts every ported tool). */
const FIGMA_PLUGIN_URL = "https://github.com/Liiift-Studio/type-tools/tree/main/packages/figma-plugin"

/**
 * Renders the no-code integration paths a tool ships. Pass only the props for the ports it has.
 * e.g. <PortsSection npm="@liiift-studio/floodtext" bundle="floodtext" attr="data-floodtext" framerComponent="FloodText" repo="Liiift-Studio/FloodText" figma="frozen" />
 */
export default function PortsSection({ npm, bundle, attr, framerComponent, repo, figma }: PortsSectionProps) {
	const hasWebflow = !!(npm && bundle && attr)
	const platforms = [hasWebflow && "Webflow", framerComponent && "Framer", figma && "Figma"].filter(Boolean) as string[]
	if (platforms.length === 0) return null

	// "Webflow", "Webflow & Framer", or "Webflow, Framer & Figma".
	const heading =
		platforms.length === 1
			? platforms[0]
			: `${platforms.slice(0, -1).join(", ")} & ${platforms[platforms.length - 1]}`

	const cdn = `https://cdn.jsdelivr.net/npm/${npm}/dist/${bundle}.webflow.min.js`
	const webflowSnippet =
		`<!-- Site Settings → Custom Code → Footer, or an Embed element -->\n` +
		`<script src="${cdn}"></script>\n\n` +
		`<!-- Then add ${attr} to any text element -->\n` +
		`<h1 ${attr}>Your headline</h1>`

	return (
		<section className="w-full max-w-2xl lg:max-w-5xl flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<p className="text-xs uppercase tracking-[0.18em] font-medium text-muted">no-code</p>
				<h2 className="text-2xl lg:text-4xl">Use it in {heading}</h2>
				<p className="text-base leading-relaxed max-w-lg text-muted">
					The same effect, no build step — drop it straight into your design tool.
				</p>
			</div>

			<div className="flex flex-col gap-8">
				{/* Webflow */}
				{hasWebflow && (
					<div className="flex flex-col gap-3">
						<h3 className="text-lg font-medium">Webflow</h3>
						<p className="text-sm text-muted max-w-lg">
							One script tag, then mark any element with{" "}
							<code className="text-foreground">{attr}</code>. Configure it with{" "}
							<code className="text-foreground">data-*</code> attributes.
						</p>
						<CodeBlock code={webflowSnippet} />
					</div>
				)}

				{/* Framer */}
				{framerComponent && (
					<div className="flex flex-col gap-3">
						<h3 className="text-lg font-medium">Framer</h3>
						<p className="text-sm text-muted max-w-lg">
							Insert → Code → New Component, then paste{" "}
							{repo ? (
								<a
									className="text-foreground underline decoration-dotted underline-offset-2"
									href={`https://github.com/${repo}/blob/main/src/framer/${framerComponent}.tsx`}
									target="_blank"
									rel="noopener noreferrer"
								>
									{framerComponent}.tsx ↗
								</a>
							) : (
								<code className="text-foreground">{framerComponent}.tsx</code>
							)}
							. It imports the core from esm.sh and exposes every option in the
							property panel — no build step.
						</p>
						<CodeBlock code={`import { /* core */ } from "https://esm.sh/${npm}"`} />
					</div>
				)}

				{/* Figma */}
				{figma && (
					<div className="flex flex-col gap-3">
						<h3 className="text-lg font-medium">
							Figma <span className="text-xs uppercase tracking-wide text-muted">· beta</span>
						</h3>
						<p className="text-sm text-muted max-w-lg">
							Part of the{" "}
							<a
								className="text-foreground underline decoration-dotted underline-offset-2"
								href={FIGMA_PLUGIN_URL}
								target="_blank"
								rel="noopener noreferrer"
							>
								Type Tools Figma plugin ↗
							</a>{" "}
							— Plugins → Development → Import plugin from manifest, run <em>Type Tools</em>,
							and pick this tool. Here it {FIGMA_NOTE[figma]}.
						</p>
					</div>
				)}
			</div>
		</section>
	)
}
