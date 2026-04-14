// Directory of all Liiift type tools — displayed in each tool site footer

const TOOLS = [
	{ name: "Axis Rhythm",    url: "https://axisrhythm.com",    id: "axisRhythm"    },
	{ name: "Fit Flush",      url: "https://fit-flush.com",      id: "fitFlush"      },
	{ name: "Fit Width",      url: "https://fitwidth.com",      id: "fitWidth"      },
	{ name: "Flood Text",     url: "https://floodtext.com",     id: "floodText"     },
	{ name: "Glyph Shaper",   url: "https://glyphshaper.com",   id: "glyphShaper"   },
	{ name: "Hover Boldly",   url: "https://hoverboldly.com",   id: "hoverBoldly"   },
	{ name: "Magnet Type",    url: "https://magnettype.com",    id: "magnetType"    },
	{ name: "Optical Margin", url: "https://opticalmargin.com", id: "opticalMargin" },
	{ name: "Opsz Stepper",   url: "https://opszstepper.com",   id: "opszStepper"   },
	{ name: "Ragtooth",       url: "https://ragtooth.com",      id: "ragtooth"      },
	{ name: "Scroll Type",    url: "https://scrolltype.com",    id: "scrollType"    },
	{ name: "Speech Type",    url: "https://speechtype.com",    id: "speechType"    },
	{ name: "Stabil Type",    url: "https://stabiltype.com",    id: "stabilType"    },
	{ name: "Steady Gray",    url: "https://steadygray.com",    id: "steadyGray"    },
	{ name: "Surface Type",   url: "https://surfacetype.com",   id: "surfaceType"   },
	{ name: "Text Breath",    url: "https://textbreath.com",    id: "textBreath"    },
	{ name: "Typsettle",      url: "https://typsettle.com",     id: "typsettle"     },
	{ name: "Wrap Type",      url: "https://wraptype.com",      id: "wrapType"      },
]

/** Links to all tools; highlights the current one without a link. */
export default function ToolDirectory({ current }: { current: string }) {
	return (
		<nav aria-label="Other type tools" className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2">
			{TOOLS.map((tool) =>
				tool.id === current ? (
					<span key={tool.id} className="opacity-100 text-left">{tool.name}</span>
				) : (
					<a
						key={tool.id}
						href={tool.url}
						className="opacity-30 hover:opacity-100 transition-opacity text-left"
					>
						{tool.name}
					</a>
				)
			)}
		</nav>
	)
}
