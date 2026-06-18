// capture.mjs — reproducible Bold Lock visuals for the README.
// Serves the repo over HTTP, renders scripts/capture.html in headless Chromium,
// and screenshots the comparison card at rest and on hover into assets/*.png
// with transparent corners. The harness reimplements the documented algorithm
// (Canvas measureText at both weights → distribute the width delta as negative
// letter-spacing) on the real Merriweather variable font, so the captures
// reflect what the library actually does.
//
// Run: node scripts/capture.mjs
// Setup: npm i -D playwright && npx playwright install chromium

import { createServer } from "node:http"
import { readFile, mkdir } from "node:fs/promises"
import { extname, join } from "node:path"
import { chromium } from "playwright"

// Repo root — the static server resolves URLs relative to here.
const ROOT = process.cwd()

// Minimal MIME map for the assets the harness loads (html, fonts).
const MIME = {
	".html": "text/html",
	".js": "application/javascript",
	".mjs": "application/javascript",
	".css": "text/css",
	".json": "application/json",
	".png": "image/png",
	".svg": "image/svg+xml",
	".woff": "font/woff",
	".woff2": "font/woff2",
}

// Each scene maps a URL query for capture.html to an output filename.
const SCENES = [
	{ id: "compare-rest", query: "scene=compare&hover=0" },
	{ id: "compare-hover", query: "scene=compare&hover=1" },
]

// Tiny static file server so ES modules and the variable font load over HTTP.
const server = createServer(async (req, res) => {
	try {
		const url = decodeURIComponent((req.url ?? "/").split("?")[0])
		const path = join(ROOT, url === "/" ? "/scripts/capture.html" : url)
		const data = await readFile(path)
		res.writeHead(200, { "Content-Type": MIME[extname(path)] ?? "application/octet-stream" })
		res.end(data)
	} catch {
		res.writeHead(404)
		res.end("not found")
	}
})

await new Promise((r) => server.listen(0, r))
const { port } = server.address()

await mkdir(join(ROOT, "assets"), { recursive: true })

const browser = await chromium.launch()
for (const scene of SCENES) {
	// deviceScaleFactor 2 → retina-sharp PNGs.
	const page = await browser.newPage({ deviceScaleFactor: 2 })
	await page.goto(`http://localhost:${port}/scripts/capture.html?${scene.query}`, {
		waitUntil: "networkidle",
	})
	// The harness sets body[data-ready="1"] once fonts + measurement settle.
	await page.waitForSelector("body[data-ready='1']", { timeout: 10000 })
	await page.waitForTimeout(400) // let the variable glyphs + transition paint
	const card = await page.$("#card")
	// omitBackground keeps the area outside the card's border-radius transparent.
	await card.screenshot({ path: `assets/${scene.id}.png`, omitBackground: true })
	console.log("captured assets/%s.png", scene.id)
	await page.close()
}

await browser.close()
server.close()
