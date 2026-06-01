// layout.tsx — root layout for hoverBoldly site
import type { Metadata } from "next"
import "./globals.css"
import localFont from "next/font/local"

// Use locally-hosted Inter to avoid build-time network requests to Google Fonts
const inter = localFont({
	src: "../../public/fonts/inter-300.woff",
	variable: "--font-sans",
	weight: "300",
	display: "swap",
})

export const metadata: Metadata = {
	title: "Hover Boldly — Bold on hover, zero layout shift",
	icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
	description:
		"Bold on hover without layout shift. Measures the width difference between normal and bold weight using Canvas, then compensates with letter-spacing. Zero reflow.",
	keywords: ["hover boldly", "bold hover", "no layout shift", "variable font", "typography", "TypeScript", "npm"],
	openGraph: {
		title: "Hover Boldly — Bold on hover, zero layout shift",
		description: "Text goes bold on hover. The line width stays exactly the same. No reflow, no shift.",
		url: "https://hoverboldly.com",
		siteName: "Hover Boldly",
		type: "website",
		images: [
			{
				url: "https://hoverboldly.com/opengraph-image",
				width: 1200,
				height: 630,
				alt: "Hover Boldly — Bold on hover, zero layout shift",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Hover Boldly — Bold on hover, zero layout shift",
		description: "Text goes bold on hover. The line width stays exactly the same. No reflow, no shift.",
		images: ["https://hoverboldly.com/opengraph-image"],
	},
	metadataBase: new URL("https://hoverboldly.com"),
	alternates: { canonical: "https://hoverboldly.com" },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`h-full antialiased ${inter.variable}`}>
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	)
}
