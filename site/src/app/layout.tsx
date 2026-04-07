import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
	title: "Bold Lock — Bold on hover, zero layout shift",
	icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
	description:
		"Bold Lock lets text go bold on hover without layout shift. It measures the width difference between normal and bold weight using Canvas, then compensates with letter-spacing so the line never moves.",
	keywords: ["bold lock", "bold hover", "no layout shift", "variable font", "typography", "TypeScript", "npm"],
	openGraph: {
		title: "Bold Lock — Bold on hover, zero layout shift",
		description: "Text goes bold on hover. The line width stays exactly the same. No reflow, no shift.",
		url: "https://bold-lock.liiift.studio",
		siteName: "Bold Lock",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Bold Lock — Bold on hover, zero layout shift",
		description: "Text goes bold on hover. The line width stays exactly the same. No reflow, no shift.",
	},
	metadataBase: new URL("https://bold-lock.liiift.studio"),
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className="h-full antialiased">
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	)
}
