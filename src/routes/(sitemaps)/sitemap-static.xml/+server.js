// 정적 페이지 Sitemap
export async function GET({ url }) {
	const origin = url.origin;
	const now = new Date().toISOString();

	const pages = [
		{ path: '/', priority: '1.0', changefreq: 'hourly' },
		{ path: '/community', priority: '0.9', changefreq: 'daily' },
		{ path: '/service', priority: '0.9', changefreq: 'daily' },
		{ path: '/outsourcing', priority: '0.9', changefreq: 'daily' },
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
	.map(
		(page) => `  <url>
    <loc>${origin}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=86400', // 24시간 캐시
		},
	});
}
