import { create_api } from '$lib/supabase/api';

// 커뮤니티 Sitemap
export async function GET({ locals: { supabase }, url }) {
	try {
		const origin = url.origin;

		// 모든 커뮤니티 조회 (slug 필요)
		const { data: communities, error } = await supabase
			.from('communities')
			.select('slug, created_at, updated_at')
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching communities:', error);
			throw error;
		}

		if (!communities || communities.length === 0) {
			return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
				headers: {
					'Content-Type': 'application/xml',
					'Cache-Control': 'public, max-age=7200', // 2시간 캐시 (커뮤니티는 자주 안 변함)
				},
			});
		}

		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${communities
	.map((community) => {
		const lastmod = community.updated_at || community.created_at || new Date().toISOString();
		return `  <url>
    <loc>${origin}/community/${community.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
	})
	.join('\n')}
</urlset>`;

		return new Response(xml, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'public, max-age=7200', // 2시간 캐시
			},
		});
	} catch (error) {
		console.error('Error generating communities sitemap:', error);
		return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
			status: 500,
			headers: {
				'Content-Type': 'application/xml',
			},
		});
	}
}
