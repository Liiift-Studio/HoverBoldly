// PortsSection.tsx — "Use it anywhere" block surfacing the Webflow embed + Framer code component.
// Synced to every tool site from type-tools/shared/components/. Presentational: each page passes
// its own tool's port identifiers, so there is no central id map to keep in sync.
import CodeBlock from "./CodeBlock"

interface PortsSectionProps {
	/** npm package name, e.g. "@liiift-studio/floodtext". */
	npm: string
	/** Webflow bundle basename — served at dist/<bundle>.webflow.min.js, e.g. "floodtext". */
	bundle: string
	/** Opt-in data attribute for the Webflow embed, e.g. "data-floodtext". */
	attr: string
	/** Framer code component name, e.g. "FloodText". Omit when the tool has no Framer port. */
	framerComponent?: string
	/** GitHub "org/repo" used to link the Framer component source, e.g. "Liiift-Studio/FloodText". */
	repo?: string
}

/**
 * Renders the no-code integration paths (Webflow embed, optional Framer component) for a tool.
 * Drop into a landing page: <PortsSection npm="@liiift-studio/floodtext" bundle="floodtext" attr="data-floodtext" framerComponent="FloodText" repo="Liiift-Studio/FloodText" />
 */
export default function PortsSection({ npm, bundle, attr, framerComponent, repo }: PortsSectionProps) {
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
				<h2 className="text-2xl lg:text-4xl">
					Use it in Webflow{framerComponent ? " & Framer" : ""}
				</h2>
				<p className="text-base leading-relaxed max-w-lg text-muted">
					The same effect, no build step — drop it straight into your design tool.
				</p>
			</div>

			<div className="flex flex-col gap-8">
				{/* Webflow */}
				<div className="flex flex-col gap-3">
					<h3 className="text-lg font-medium">Webflow</h3>
					<p className="text-sm text-muted max-w-lg">
						One script tag, then mark any element with{" "}
						<code className="text-foreground">{attr}</code>. Configure it with{" "}
						<code className="text-foreground">data-*</code> attributes.
					</p>
					<CodeBlock code={webflowSnippet} />
				</div>

				{/* Framer (only when the tool ships a Framer component) */}
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
			</div>
		</section>
	)
}
