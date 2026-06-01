// next.config.ts — synced from type-tools/shared/site/next.config.ts. Do not edit directly.
import type { NextConfig } from "next"
import path from "path"

const securityHeaderList = [
	{ key: "X-Frame-Options",         value: "SAMEORIGIN" },
	{ key: "X-Content-Type-Options",  value: "nosniff" },
	{ key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
	{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
]

const nextConfig: NextConfig = {
	turbopack: {
		// Set workspace root so Turbopack can resolve the sibling npm package
		// and imports like ../../../package.json from within the site/ subdirectory.
		root: path.resolve(__dirname, ".."),
	},
	// Prevent Pyodide-based packages from being bundled by webpack — they require
	// Node.js fs APIs and use dynamic requires that the bundler cannot analyse.
	// Harmless on tools that don't install these packages.
	serverExternalPackages: ["@web-alchemy/fonttools", "vf-clamp"],
	headers: () => Promise.resolve([
		{ source: "/(.*)", headers: securityHeaderList },
	]),
}

export default nextConfig
