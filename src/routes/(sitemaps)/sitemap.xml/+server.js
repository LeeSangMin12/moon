// Sitemap Index - 모든 sitemap 파일 목록
export async function GET({ url }) {
	const origin = url.origin;
	const now = new Date().toISOString();

	const sitemaps = [
		{ loc: `${origin}/sitemap-static.xml`, lastmod: now },
		{ loc: `${origin}/sitemap-posts.xml`, lastmod: now },
		{ loc: `${origin}/sitemap-services.xml`, lastmod: now },
		{ loc: `${origin}/sitemap-communities.xml`, lastmod: now },
		{ loc: `${origin}/sitemap-users.xml`, lastmod: now },
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
	.map(
		(s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`,
	)
	.join('\n')}
</sitemapindex>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600', // 1시간 캐시
		},
	});
}
