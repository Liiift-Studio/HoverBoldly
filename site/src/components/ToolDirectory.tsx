// Directory of all Liiift type tools — displayed in each tool site footer

const TOOLS = [
	{ name: "Axis Rhythm",    url: "https://axisrhythm.com",                    id: "axisRhythm",    desc: "Alternates variable font axes per line for rhythmic texture",         short: "Per-line axis rhythm"   },
	{ name: "Fit Flush",      url: "https://fit-flush.com",                      id: "fitFlush",      desc: "Expands tracking and axes to flush-fill a container",                  short: "Flush-fill container"   },
	{ name: "Fit Width",      url: "https://fitwidth.com",                       id: "fitWidth",      desc: "Scales tracking and axes to fill the full display width",              short: "Fill display width"     },
	{ name: "Flood Text",     url: "https://floodtext.com",                      id: "floodText",     desc: "Animates variable font axes in waves across each character",           short: "Per-char wave"          },
	{ name: "Glyph Shaper",   url: "https://glyphshaper.com",                   id: "glyphShaper",   desc: "Edit bezier glyph paths live via opentype.js",                         short: "Edit glyph paths"       },
	{ name: "Hover Boldly",   url: "https://hoverboldly.com",                   id: "hoverBoldly",   desc: "Bolds text on hover without shifting surrounding layout",              short: "Bold, no shift"         },
	{ name: "Magnet Type",    url: "https://magnettype.com",                     id: "magnetType",    desc: "Varies font axes per character by cursor proximity",                   short: "Cursor-field axes"      },
	{ name: "Optical Margin", url: "https://opticalmargin.com",                  id: "opticalMargin", desc: "Hangs punctuation beyond the text block for optical alignment",        short: "Hanging punctuation"    },
	{ name: "Opsz Stepper",   url: "https://opszstepper.com",                   id: "opszStepper",   desc: "Hot-swaps optical font families as font-size crosses thresholds",      short: "Font-size steps"        },
	{ name: "Ragtooth",       url: "https://ragtooth.com",                       id: "ragtooth",      desc: "Sets a deliberate sawtooth rag on paragraph line endings",             short: "Sawtooth rag"           },
	{ name: "Speech Type",    url: "https://speechtype.vercel.app",              id: "speechType",    desc: "Highlights each spoken word with typographic emphasis in real time",   short: "Voice emphasis"         },
	{ name: "Stabil Type",    url: "https://stabiltype-liiift.vercel.app",       id: "stabilType",    desc: "Adapts tracking, weight, and opsz to motion velocity",                 short: "Motion-adaptive"        },
	{ name: "Steady Gray",    url: "https://steadygray.com",                     id: "steadyGray",    desc: "Equalises optical density across paragraph lines",                     short: "Optical density"        },
	{ name: "Text Breath",    url: "https://textbreath.com",                     id: "textBreath",    desc: "Oscillates letter-spacing per line in a slow breathing wave",          short: "Breathing spacing"      },
	{ name: "Typsettle",      url: "https://typsettle.com",                      id: "typsettle",     desc: "Settles per-line tracking from loose to tight after layout",           short: "Tracking settle"        },
	{ name: "Wrap Type",      url: "https://wraptype.com",                       id: "wrapType",      desc: "Wraps live DOM text around any 3D surface with CSS3D and SDF",        short: "3D text wrap"           },
]

/** Links to all tools; highlights the current one without a link. */
export default function ToolDirectory({ current }: { current: string }) {
	return (
		<nav aria-label="Other type tools" className="grid grid-cols-2 sm:grid-cols-4 gap-x-8" style={{ rowGap: '0.5em' }}>
			{TOOLS.map((tool) => {
				const label = (
					<>
						<span>{tool.name}</span>
						<span className="hidden sm:block" style={{ fontSize: '0.72em', opacity: 0.5, marginTop: '0.18em' }}>{tool.desc}</span>
						<span className="sm:hidden" style={{ fontSize: '0.8em', opacity: 0.5, marginTop: '0.18em' }}>{tool.short}</span>
					</>
				)
				return tool.id === current ? (
					<span key={tool.id} className="flex flex-col opacity-100 text-left">{label}</span>
				) : (
					<a
						key={tool.id}
						href={tool.url}
						className="flex flex-col opacity-30 hover:opacity-100 transition-opacity text-left"
					>
						{label}
					</a>
				)
			})}
		</nav>
	)
}
