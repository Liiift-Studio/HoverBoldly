// OG image for hoverboldly.com — generated at build time via next/og
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Hover Boldly — Bold on hover, zero layout shift'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
	const interLight = await readFile(join(process.cwd(), 'public/fonts/inter-300.woff'))
	return new ImageResponse(
		(
			<div style={{ background: '#fad9a2', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 80px', fontFamily: 'Inter, sans-serif' }}>
				{/* Eyebrow label */}
				<span style={{ fontSize: 13, letterSpacing: '0.18em', color: '#564c3b', textTransform: 'uppercase' }}>hover boldly</span>

				{/* Decorative bars + headline */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
						{[1, 0.58, 1, 0.58, 1].map((scale, i) => (
							<div
								key={i}
								style={{
									width: `${scale * 600}px`,
									height: 3,
									background: i % 2 === 0 ? '#564c3b' : '#8d8578',
									borderRadius: 2,
								}}
							/>
						))}
					</div>
					<div style={{ fontSize: 76, color: '#322000', lineHeight: 1.06, fontWeight: 700, marginBottom: 16 }}>Bold on hover.</div>
					<div style={{ fontSize: 76, color: '#564c3b', lineHeight: 1.06, fontWeight: 300 }}>Zero layout shift.</div>
				</div>

				{/* Footer */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
					<div style={{ fontSize: 14, color: '#564c3b', letterSpacing: '0.04em', display: 'flex', gap: 20 }}>
						<span>TypeScript</span>
						<span style={{ opacity: 0.4 }}>·</span>
						<span>Canvas measurement</span>
						<span style={{ opacity: 0.4 }}>·</span>
						<span>React + Vanilla JS</span>
					</div>
					<div style={{ fontSize: 13, color: '#716858', letterSpacing: '0.04em' }}>hoverboldly.com</div>
				</div>
			</div>
		),
		{ ...size, fonts: [{ name: 'Inter', data: interLight, style: 'normal', weight: 300 }] },
	)
}
