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

/** Renders a syntax-highlighted code block with a clipboard copy button */
export default function CodeBlock({ code }: { code: string }) {
	const [copied, setCopied] = useState(false)

	function copy() {
		navigator.clipboard.writeText(code).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		})
	}

	return (
		<div className="relative rounded-lg px-5 py-4 flex items-center gap-6" style={{ background: 'rgba(0,0,0,0.35)' }}>
			<pre className="overflow-x-auto text-xs leading-relaxed font-mono flex-1">
				<code>{tokenize(code)}</code>
			</pre>
			<button
				onClick={copy}
				className="shrink-0 self-start text-xs opacity-30 hover:opacity-80 transition-opacity font-mono pt-px"
				aria-label="Copy code to clipboard"
			>
				{copied ? 'copied' : 'copy'}
			</button>
		</div>
	)
}
