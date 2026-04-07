import type { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
	return [{ url: 'https://bold-lock.liiift.studio', lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }]
}
