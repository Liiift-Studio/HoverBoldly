"use client"

// Click-to-copy npm install snippet with a link to the npm package page
import { useState } from "react"

const CMD = "npm install weight-hover"
const NPM_URL = "https://www.npmjs.com/package/weight-hover"

/** Displays the install command, copies it to clipboard on click, and links to npm */
export default function CopyInstall() {
	const [copied, setCopied] = useState(false)

	function handleCopy() {
		navigator.clipboard.writeText(CMD).then(() => {
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
				className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 active:bg-white/30 px-3 py-1.5 rounded font-mono transition-colors cursor-pointer select-all"
			>
				<span>{CMD}</span>
				<span className="opacity-50 text-xs transition-opacity">
					{copied ? "✓" : "⎘"}
				</span>
			</button>
			<a
				href={NPM_URL}
				target="_blank"
				rel="noopener noreferrer"
				className="text-sm opacity-50 hover:opacity-100 transition-opacity"
			>
				npm ↗
			</a>
		</div>
	)
}
