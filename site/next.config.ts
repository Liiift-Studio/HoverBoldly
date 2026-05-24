// next.config.ts — synced from type-tools/shared/site/next.config.ts. Do not edit directly.
import type { NextConfig } from "next"
import path from "path"

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
}

export default nextConfig
