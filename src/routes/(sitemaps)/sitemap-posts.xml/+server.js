import { create_api } from '$lib/supabase/api';

// 게시물 Sitemap
export async function GET({ locals: { supabase }, url }) {
	try {
		const api = create_api(supabase);
		const origin = url.origin;

		// 최신 게시물 최대 5000개 (Google 권장 최대 50,000개)
		const posts = await api.posts.select_infinite_scroll('', '', 5000);

		if (!posts || posts.length === 0) {
			return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
				headers: {
					'Content-Type': 'application/xml',
					'Cache-Control': 'public, max-age=1800', // 30분 캐시
				},
			});
		}

		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${posts
	.map((post) => {
		const lastmod = post.updated_at || post.created_at || new Date().toISOString();
		return `  <url>
    <loc>${origin}/@${post.users?.handle || 'unknown'}/post/${post.id}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
	})
	.join('\n')}
</urlset>`;

		return new Response(xml, {
			headers: {
				'Content-Type': 'application/xml',
				'Cache-Control': 'public, max-age=1800', // 30분 캐시
			},
		});
	} catch (error) {
		console.error('Error generating posts sitemap:', error);
		return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
			status: 500,
			headers: {
				'Content-Type': 'application/xml',
			},
		});
	}
}
