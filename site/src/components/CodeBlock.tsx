'use client'
// Lightweight syntax-highlighted code block with clipboard copy — keywords bold, strings italic, punctuation muted
import { useState } from 'react'
import type { ReactNode } from 'react'

const KEYWORDS = new Set([
	'import', 'export', 'from', 'const', 'let', 'var',
	'function', 'return', 'new', 'default', 'async', 'await',
])

// Captures: (comment) | (string) | (identifier) | (punctuation)
const TOKEN = /(\/\/[^\n]*)|(`[^`]*`|'[^']*'|"[^"]*")|\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b|([\[\]{}()<>=,;./])/g

/** Tokenise code into styled ReactNodes */
function tokenize(code: string): ReactNode[] {
	const nodes: ReactNode[] = []
	let last = 0
	let key = 0
	TOKEN.lastIndex = 0
	let match: RegExpExecArray | null

	while ((match = TOKEN.exec(code)) !== null) {
		// Plain gap (whitespace, numbers, operators not in punct set)
		if (match.index > last) {
			nodes.push(<span key={key++} style={{ opacity: 0.6 }}>{code.slice(last, match.index)}</span>)
		}

		const [full, comment, str, word, punct] = match

		if (comment) {
			nodes.push(<span key={key++} style={{ opacity: 0.6 }}>{comment}</span>)
		} else if (str) {
			nodes.push(<em key={key++} style={{ fontStyle: 'italic', opacity: 0.6 }}>{str}</em>)
		} else if (word) {
			if (KEYWORDS.has(word)) {
				nodes.push(<strong key={key++} style={{ fontWeight: 600 }}>{word}</strong>)
			} else {
				nodes.push(<span key={key++}>{word}</span>)
			}
		} else if (punct) {
			nodes.push(<span key={key++} style={{ opacity: 0.6 }}>{punct}</span>)
		}

		last = match.index + full.length
	}

	if (last < code.length) {
		nodes.push(<span key={key++} style={{ opacity: 0.6 }}>{code.slice(last)}</span>)
	}

	return nodes
}

/** Renders a syntax-highlighted code block with an absolute clipboard copy button */
export default function CodeBlock({ code }: { code: string }) {
	const [copied, setCopied] = useState(false)

	async function copy() {
		if (!navigator.clipboard) return
		try {
			await navigator.clipboard.writeText(code)
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		} catch {}
	}

	// Theme-aware code surface — the tool's --panel with its foreground text, so it harmonises with
	// the page (a tinted-light block on light tools, a tinted-dark block on dark tools) instead of a
	// jarring neutral-black island. Syntax tokens inherit currentColor, so they adapt with it.
	return (
		<div className="relative rounded-lg px-5 py-4" style={{ background: 'var(--panel)', outline: '1px solid color-mix(in oklch, var(--foreground) 14%, transparent)', color: 'var(--foreground)' }}>
			<pre className="overflow-x-auto text-xs leading-relaxed font-mono pr-8">
				<code>{tokenize(code)}</code>
			</pre>
			<button
				onClick={copy}
				className="absolute top-3 right-3 p-1.5 rounded text-subtle hover:text-foreground hover:bg-foreground/10 transition-colors"
				aria-label="Copy code to clipboard"
			>
				{copied ? (
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
						<polyline points="20 6 9 17 4 12" />
					</svg>
				) : (
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
						<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
					</svg>
				)}
			</button>
		</div>
	)
}
