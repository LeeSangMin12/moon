export async function GET() {
	return new Response(
		`
		<?xml version="1.0" encoding="UTF-8" ?>
		<urlset
					xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
					xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
					xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
								http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

		<url>
			<loc>https://moon.it.kr/</loc>
			<lastmod>2025-07-28T10:00:00+00:00</lastmod>
		</url>
		</urlset>`.trim(),
		{
			headers: {
				'Content-Type': 'application/xml',
			},
		},
	);
}
