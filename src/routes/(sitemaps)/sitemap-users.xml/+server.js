import { create_api } from '$lib/supabase/api';

// 사용자 프로필 Sitemap
export async function GET({ locals: { supabase }, url }) {
	try {
		const origin = url.origin;

		// 활성 사용자 조회 (handle 필요, 비회원 제외)
		const { data: users, error } = await supabase
			.from('users')
			.select('handle, created_at, updated_at')
			.neq('handle', '비회원')
			.order('created_at', { ascending: false })
			.limit(5000); // 최대 5000명

		if (error) {
			console.error('Error fetching users:', error);
			throw error;
		}

		if (!users || users.length === 0) {
			return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
				headers: {
					'Content-Type': 'application/xml',
					'Cache-Control': 'public, max-age=7200', // 2시간 캐시
				},
			});
		}

		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${users
	.map((user) => {
		const lastmod = user.updated_at || user.created_at || new Date().toISOString();
		return `  <url>
    <loc>${origin}/@${user.handle}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
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
		console.error('Error generating users sitemap:', error);
		return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
			status: 500,
			headers: {
				'Content-Type': 'application/xml',
			},
		});
	}
}
