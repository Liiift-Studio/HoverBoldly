// Directory of all Liiift type tools — displayed in each tool site footer

const TOOLS = [
	{ name: "Ragtooth",       url: "https://ragtooth.com",       id: "ragtooth"      },
	{ name: "Axis Rhythm",    url: "https://axisrhythm.com",    id: "axisRhythm"    },
	{ name: "Optical Margin", url: "https://opticalmargin.com", id: "opticalMargin" },
	{ name: "Steady Gray",    url: "https://steadygray.com",    id: "steadyGray"    },
	{ name: "Hover Boldly",   url: "https://hoverboldly.com",   id: "hoverBoldly"   },
	{ name: "Flood Text",     url: "https://floodtext.com",     id: "floodText"     },
	{ name: "Typsettle",      url: "https://typsettle.com",     id: "typsettle"     },
	{ name: "Text Breath",    url: "https://textbreath.com",    id: "textBreath"    },
]

/** Links to all tools; highlights the current one without a link. */
export default function ToolDirectory({ current }: { current: string }) {
	return (
		<nav aria-label="Other type tools" className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2">
			{TOOLS.map((tool) =>
				tool.id === current ? (
					<span key={tool.id} className="opacity-100">{tool.name}</span>
				) : (
					<a
						key={tool.id}
						href={tool.url}
						
						
						className="opacity-30 hover:opacity-100 transition-opacity"
					>
						{tool.name}
					</a>
				)
			)}
		</nav>
	)
}
