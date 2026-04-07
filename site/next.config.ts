import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
	turbopack: {
		// Set workspace root so Turbopack can resolve sibling packages and
		// imports like ../../../package.json from within the site/ subdirectory
		root: path.resolve(__dirname, ".."),
	},
};
export default nextConfig;

