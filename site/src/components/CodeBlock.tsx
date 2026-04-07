// Lightweight syntax-highlighted code block — keywords bold, strings italic, punctuation muted
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

/** Renders a syntax-highlighted code snippet */
export default function CodeBlock({ code }: { code: string }) {
	return (
		<pre className="bg-white/5 rounded p-4 overflow-x-auto text-xs leading-relaxed font-mono">
			<code>{tokenize(code)}</code>
		</pre>
	)
}
