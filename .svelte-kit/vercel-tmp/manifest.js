export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","google8d6c4e3bfe5b5492.html","logo.png","naverfd91c5e33ed9c413444f9db8d0da297e.html","open_graph_img.png","robots.txt","service-worker.js","service-worker.js"]),
	mimeTypes: {".png":"image/png",".html":"text/html",".txt":"text/plain",".js":"text/javascript"},
	_: {
		client: {start:"_app/immutable/entry/start.mYSBEH7L.js",app:"_app/immutable/entry/app.O5fW5aZj.js",imports:["_app/immutable/entry/start.mYSBEH7L.js","_app/immutable/chunks/GJNCZluG.js","_app/immutable/chunks/6-0n6YEw.js","_app/immutable/chunks/B-scR1XU.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/CGIzpWb9.js","_app/immutable/chunks/D2BvqDim.js","_app/immutable/chunks/IpRNG7QP.js","_app/immutable/chunks/DDBKWaPS.js","_app/immutable/chunks/BM5vwS9L.js","_app/immutable/chunks/BpvKUMwS.js","_app/immutable/entry/app.O5fW5aZj.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/B-scR1XU.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/CGIzpWb9.js","_app/immutable/chunks/D2BvqDim.js","_app/immutable/chunks/IpRNG7QP.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/6-0n6YEw.js","_app/immutable/chunks/DDBKWaPS.js","_app/immutable/chunks/IsBR_rX4.js","_app/immutable/chunks/CaAiD08f.js","_app/immutable/chunks/Bs63VWsq.js","_app/immutable/chunks/Df9HgeLj.js","_app/immutable/chunks/BpvKUMwS.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js')),
			__memo(() => import('../output/server/nodes/4.js')),
			__memo(() => import('../output/server/nodes/5.js')),
			__memo(() => import('../output/server/nodes/6.js')),
			__memo(() => import('../output/server/nodes/7.js')),
			__memo(() => import('../output/server/nodes/8.js')),
			__memo(() => import('../output/server/nodes/9.js')),
			__memo(() => import('../output/server/nodes/10.js')),
			__memo(() => import('../output/server/nodes/11.js')),
			__memo(() => import('../output/server/nodes/12.js')),
			__memo(() => import('../output/server/nodes/13.js')),
			__memo(() => import('../output/server/nodes/14.js')),
			__memo(() => import('../output/server/nodes/15.js')),
			__memo(() => import('../output/server/nodes/16.js')),
			__memo(() => import('../output/server/nodes/17.js')),
			__memo(() => import('../output/server/nodes/18.js')),
			__memo(() => import('../output/server/nodes/19.js')),
			__memo(() => import('../output/server/nodes/20.js')),
			__memo(() => import('../output/server/nodes/21.js')),
			__memo(() => import('../output/server/nodes/22.js')),
			__memo(() => import('../output/server/nodes/23.js')),
			__memo(() => import('../output/server/nodes/24.js')),
			__memo(() => import('../output/server/nodes/25.js')),
			__memo(() => import('../output/server/nodes/26.js')),
			__memo(() => import('../output/server/nodes/27.js')),
			__memo(() => import('../output/server/nodes/28.js')),
			__memo(() => import('../output/server/nodes/29.js')),
			__memo(() => import('../output/server/nodes/30.js')),
			__memo(() => import('../output/server/nodes/31.js')),
			__memo(() => import('../output/server/nodes/32.js')),
			__memo(() => import('../output/server/nodes/33.js')),
			__memo(() => import('../output/server/nodes/34.js')),
			__memo(() => import('../output/server/nodes/35.js')),
			__memo(() => import('../output/server/nodes/36.js')),
			__memo(() => import('../output/server/nodes/37.js')),
			__memo(() => import('../output/server/nodes/38.js')),
			__memo(() => import('../output/server/nodes/39.js')),
			__memo(() => import('../output/server/nodes/40.js')),
			__memo(() => import('../output/server/nodes/41.js')),
			__memo(() => import('../output/server/nodes/42.js')),
			__memo(() => import('../output/server/nodes/43.js'))
		],
		routes: [
			{
				id: "/(main)",
				pattern: /^\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/(main)/@[handle]",
				pattern: /^\/@([^/]+?)\/?$/,
				params: [{"name":"handle","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/(main)/@[handle]/accounts",
				pattern: /^\/@([^/]+?)\/accounts\/?$/,
				params: [{"name":"handle","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/(main)/@[handle]/accounts/bookmark",
				pattern: /^\/@([^/]+?)\/accounts\/bookmark\/?$/,
				params: [{"name":"handle","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/(main)/@[handle]/accounts/community",
				pattern: /^\/@([^/]+?)\/accounts\/community\/?$/,
				params: [{"name":"handle","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/(main)/@[handle]/accounts/event",
				pattern: /^\/@([^/]+?)\/accounts\/event\/?$/,
				params: [{"name":"handle","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/(main)/@[handle]/accounts/like",
				pattern: /^\/@([^/]+?)\/accounts\/like\/?$/,
				params: [{"name":"handle","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/(main)/@[handle]/accounts/notice",
				pattern: /^\/@([^/]+?)\/accounts\/notice\/?$/,
				params: [{"name":"handle","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 11 },
				endpoint: null
			},
			{
				id: "/(main)/@[handle]/accounts/orders",
				pattern: /^\/@([^/]+?)\/accounts\/orders\/?$/,
				params: [{"name":"handle","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 12 },
				endpoint: null
			},
			{
				id: "/(main)/@[handle]/accounts/point",
				pattern: /^\/@([^/]+?)\/accounts\/point\/?$/,
				params: [{"name":"handle","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 13 },
				endpoint: null
			},
			{
				id: "/(main)/@[handle]/accounts/profile",
				pattern: /^\/@([^/]+?)\/accounts\/profile\/?$/,
				params: [{"name":"handle","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 14 },
				endpoint: null
			},
			{
				id: "/(main)/@[handle]/accounts/profile/modify",
				pattern: /^\/@([^/]+?)\/accounts\/profile\/modify\/?$/,
				params: [{"name":"handle","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 15 },
				endpoint: null
			},
			{
				id: "/(main)/@[handle]/post/[post_id]",
				pattern: /^\/@([^/]+?)\/post\/([^/]+?)\/?$/,
				params: [{"name":"handle","optional":false,"rest":false,"chained":false},{"name":"post_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 16 },
				endpoint: null
			},
			{
				id: "/(main)/admin",
				pattern: /^\/admin\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 17 },
				endpoint: null
			},
			{
				id: "/(main)/admin/account-transition",
				pattern: /^\/admin\/account-transition\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 18 },
				endpoint: null
			},
			{
				id: "/(main)/admin/home",
				pattern: /^\/admin\/home\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 19 },
				endpoint: null
			},
			{
				id: "/(main)/admin/moon-charges",
				pattern: /^\/admin\/moon-charges\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 20 },
				endpoint: null
			},
			{
				id: "/(main)/admin/withdrawals",
				pattern: /^\/admin\/withdrawals\/?$/,
				params: [],
				page: { layouts: [0,2,3,], errors: [1,,,], leaf: 21 },
				endpoint: null
			},
			{
				id: "/api/search",
				pattern: /^\/api\/search\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/search/_server.js'))
			},
			{
				id: "/(main)/auth/auth-code-error",
				pattern: /^\/auth\/auth-code-error\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 22 },
				endpoint: null
			},
			{
				id: "/(main)/auth/callback",
				pattern: /^\/auth\/callback\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/(main)/auth/callback/_server.js'))
			},
			{
				id: "/(main)/chat",
				pattern: /^\/chat\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 23 },
				endpoint: null
			},
			{
				id: "/(main)/chat/[roomId]",
				pattern: /^\/chat\/([^/]+?)\/?$/,
				params: [{"name":"roomId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 24 },
				endpoint: null
			},
			{
				id: "/(main)/community",
				pattern: /^\/community\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 25 },
				endpoint: null
			},
			{
				id: "/(main)/community/regi",
				pattern: /^\/community\/regi\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 27 },
				endpoint: null
			},
			{
				id: "/(main)/community/regi/Set_avatar",
				pattern: /^\/community\/regi\/Set_avatar\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 28 },
				endpoint: null
			},
			{
				id: "/(main)/community/regi/Set_content",
				pattern: /^\/community\/regi\/Set_content\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 29 },
				endpoint: null
			},
			{
				id: "/(main)/community/regi/Set_topic",
				pattern: /^\/community\/regi\/Set_topic\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 30 },
				endpoint: null
			},
			{
				id: "/(main)/community/[slug]",
				pattern: /^\/community\/([^/]+?)\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 26 },
				endpoint: null
			},
			{
				id: "/(main)/login",
				pattern: /^\/login\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 31 },
				endpoint: null
			},
			{
				id: "/(main)/regi/post",
				pattern: /^\/regi\/post\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 32 },
				endpoint: null
			},
			{
				id: "/(main)/regi/post/[post_id]",
				pattern: /^\/regi\/post\/([^/]+?)\/?$/,
				params: [{"name":"post_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 33 },
				endpoint: null
			},
			{
				id: "/(main)/regi/service",
				pattern: /^\/regi\/service\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 34 },
				endpoint: null
			},
			{
				id: "/(main)/regi/service/[service_id]",
				pattern: /^\/regi\/service\/([^/]+?)\/?$/,
				params: [{"name":"service_id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 35 },
				endpoint: null
			},
			{
				id: "/(main)/search",
				pattern: /^\/search\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 36 },
				endpoint: null
			},
			{
				id: "/(main)/service",
				pattern: /^\/service\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 37 },
				endpoint: null
			},
			{
				id: "/(main)/service/[id]",
				pattern: /^\/service\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 38 },
				endpoint: null
			},
			{
				id: "/(main)/service/[id]/review",
				pattern: /^\/service\/([^/]+?)\/review\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 39 },
				endpoint: null
			},
			{
				id: "/(main)/sign-up",
				pattern: /^\/sign-up\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 40 },
				endpoint: null
			},
			{
				id: "/(main)/sign-up/Set_avatar",
				pattern: /^\/sign-up\/Set_avatar\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 41 },
				endpoint: null
			},
			{
				id: "/(main)/sign-up/Set_basic",
				pattern: /^\/sign-up\/Set_basic\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 42 },
				endpoint: null
			},
			{
				id: "/(main)/sign-up/Set_personal",
				pattern: /^\/sign-up\/Set_personal\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 43 },
				endpoint: null
			},
			{
				id: "/sitemap.xml",
				pattern: /^\/sitemap\.xml\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/sitemap.xml/_server.js'))
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
