
import root from '../root.js';
import { set_building, set_prerendering } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_manifest, set_read_implementation } from '__sveltekit/server';
import { set_private_env, set_public_env, set_safe_public_env } from '../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hash_routing: false,
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: true,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!doctype html>\n<html lang=\"ko\" data-theme=\"light\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<meta\n\t\t\tname=\"viewport\"\n\t\t\tcontent=\"viewport-fit=cover, height=device-height, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no\"\n\t\t/>\n\n\t\t<title>당신에게 딱 맞는 전문가, 문</title>\n\t\t<link rel=\"canonical\" href=\"https://moon.it.kr\" />\n\t\t<meta\n\t\t\tname=\"description\"\n\t\t\tcontent=\"AI·마케팅·디자인·IT 등 다양한 분야의 전문가를 문에서 만나보세요.\"\n\t\t/>\n\n\t\t<meta\n\t\t\tname=\"keywords\"\n\t\t\tcontent=\"문, 전문가, 전문가 매칭, AI 전문가, 마케팅 전문가, 디자인 전문가, IT 전문가, 프리랜서, 프로젝트, 의뢰, 견적, 전문가 찾기, 전문가 추천, 전문가 연결, 전문가 플랫폼, 전문가 서비스, 전문가 등록, 전문가 상담, 전문가 포트폴리오, 전문가 리뷰, 전문가 평가, 전문가 비교, 전문가 검색, 전문가 매칭 플랫폼, 전문가 중개, 전문가 네트워크, 전문가 커뮤니티, 전문가 채팅, 전문가 의뢰, 전문가 견적서, 전문가 프로필\"\n\t\t/>\n\t\t<meta name=\"author\" content=\"devsangmin32\" />\n\n\t\t<!-- Open Graph / Facebook -->\n\t\t<meta property=\"og:type\" content=\"website\" />\n\t\t<meta property=\"og:url\" content=\"https://moon.it.kr\" />\n\t\t<meta property=\"og:title\" content=\"당신에게 딱 맞는 전문가, 문\" />\n\t\t<meta\n\t\t\tproperty=\"og:description\"\n\t\t\tcontent=\"AI·마케팅·디자인·IT 등 다양한 분야의 전문가를 문에서 만나보세요.\"\n\t\t/>\n\t\t<meta property=\"og:image:width\" content=\"1200\" />\n\t\t<meta property=\"og:image:height\" content=\"630\" />\n\t\t<meta property=\"og:site_name\" content=\"문\" />\n\t\t<meta property=\"og:locale\" content=\"ko_KR\" />\n\t\t<meta property=\"og:image\" content=\"" + assets + "/open_graph_img.png\" />\n\t\t<meta property=\"og:image:alt\" content=\"문 이미지\" />\n\n\t\t<!-- Twitter -->\n\t\t<meta property=\"twitter:card\" content=\"summary_large_image\" />\n\t\t<meta property=\"twitter:url\" content=\"https://moon.it.kr\" />\n\t\t<meta property=\"twitter:title\" content=\"당신에게 딱 맞는 전문가, 문\" />\n\t\t<meta\n\t\t\tproperty=\"twitter:description\"\n\t\t\tcontent=\"AI·마케팅·디자인·IT 등 다양한 분야의 전문가를 문에서 만나보세요.\"\n\t\t/>\n\t\t<meta\n\t\t\tproperty=\"twitter:image\"\n\t\t\tcontent=\"" + assets + "/open_graph_img.png\"\n\t\t/>\n\n\t\t<link rel=\"icon\" href=\"" + assets + "/favicon.png\" />\n\n\t\t<!-- Preload critical resources -->\n\t\t<link rel=\"preload\" href=\"" + assets + "/favicon.png\" as=\"image\" />\n\t\t<link rel=\"dns-prefetch\" href=\"//cdn.jsdelivr.net\" />\n\t\t<link rel=\"dns-prefetch\" href=\"//fonts.googleapis.com\" />\n\n\t\t<!-- Preconnect to external domains -->\n\t\t<link rel=\"preconnect\" href=\"https://cdn.jsdelivr.net\" crossorigin />\n\t\t<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" crossorigin />\n\n\t\t" + head + "\n\t</head>\n\n\t<body data-sveltekit-preload-data=\"hover\">\n\t\t<div style=\"display: contents\">" + body + "</div>\n\t</body>\n</html>\n",
		error: ({ status, message }) => ""
	},
	version_hash: "7vs8bi"
};

export async function get_hooks() {
	let handle;
	let handleFetch;
	let handleError;
	let init;
	({ handle, handleFetch, handleError, init } = await import("../../../src/hooks.server.js"));

	let reroute;
	let transport;
	

	return {
		handle,
		handleFetch,
		handleError,
		init,
		reroute,
		transport
	};
}

export { set_assets, set_building, set_manifest, set_prerendering, set_private_env, set_public_env, set_read_implementation, set_safe_public_env };
