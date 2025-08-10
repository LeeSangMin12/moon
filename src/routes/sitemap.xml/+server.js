import { create_api } from '$lib/supabase/api';

export async function GET({ locals: { supabase }, url }) {
	const api = create_api(supabase);
	const origin = url.origin;

	// Fetch latest URLs to keep sitemap small and fresh
	const posts = await api.posts.select_infinite_scroll('', '', 200);

	const staticUrls = ['/', '/community', '/service'];

	const now = new Date().toISOString();

	const urls = [
		...staticUrls.map((path) => ({ loc: origin + path, lastmod: now })),
		...posts.map((p) => ({
			loc: `${origin}/@${p.users.handle}/post/${p.id}`,
			lastmod: p.updated_at ?? p.created_at ?? now,
		})),
	];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${new Date(u.lastmod).toISOString()}</lastmod>
  </url>`,
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml' },
	});
}
