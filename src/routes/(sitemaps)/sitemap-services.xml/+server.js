import { create_api } from '$lib/supabase/api';

// 서비스 Sitemap
export async function GET({ locals: { supabase }, url }) {
	try {
		const api = create_api(supabase);
		const origin = url.origin;

		// 모든 서비스 조회
		const services = await api.services.select();

		if (!services || services.length === 0) {
			return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
				headers: {
					'Content-Type': 'application/xml',
					'Cache-Control': 'public, max-age=3600', // 1시간 캐시
				},
			});
		}

		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${services
	.map((service) => {
		const lastmod = service.updated_at || service.created_at || new Date().toISOString();
		return `  <url>
    <loc>${origin}/service/${service.id}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
	})
	.join('\n')}
</urlset>`;

		return new Response(xml, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'public, max-age=3600', // 1시간 캐시
			},
		});
	} catch (error) {
		console.error('Error generating services sitemap:', error);
		return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
			status: 500,
			headers: {
				'Content-Type': 'application/xml',
			},
		});
	}
}
