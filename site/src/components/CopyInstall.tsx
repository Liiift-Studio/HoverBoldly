"use client"

// Click-to-copy `npm install <pkg>` snippet with a link to the package's npm page.
// Shared across all Type Tools sites — synced by sync-sites.mjs; edit here, not in a submodule.
import { useState } from "react"

/** Shows `npm install <pkg>`, copies it to the clipboard on click, and links to npm. */
export default function CopyInstall({ pkg }: { pkg: string }) {
	const [copied, setCopied] = useState(false)
	const cmd = `npm install ${pkg}`
	const npmUrl = `https://www.npmjs.com/package/${pkg}`

	function handleCopy() {
		navigator.clipboard.writeText(cmd).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		}).catch(() => {
			// Clipboard write failed (no HTTPS, permission denied, etc.) — no-op
		})
	}

	return (
		<div className="flex items-center gap-3">
			<button
				onClick={handleCopy}
				title="Copy to clipboard"
				className="flex items-center gap-2 text-sm bg-foreground/10 hover:bg-foreground/20 active:bg-foreground/30 px-3 py-1.5 rounded font-mono transition-colors cursor-pointer select-all"
			>
				<span>{cmd}</span>
				<span className="opacity-50 text-xs transition-opacity">{copied ? "✓" : "⎘"}</span>
			</button>
			<a
				href={npmUrl}
				target="_blank"
				rel="noopener noreferrer"
				className="text-sm opacity-50 hover:opacity-100 transition-opacity"
			>
				npm ↗
			</a>
		</div>
	)
}
