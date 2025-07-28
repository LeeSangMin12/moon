export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28'),
	() => import('./nodes/29'),
	() => import('./nodes/30'),
	() => import('./nodes/31'),
	() => import('./nodes/32'),
	() => import('./nodes/33'),
	() => import('./nodes/34'),
	() => import('./nodes/35'),
	() => import('./nodes/36'),
	() => import('./nodes/37'),
	() => import('./nodes/38'),
	() => import('./nodes/39'),
	() => import('./nodes/40'),
	() => import('./nodes/41'),
	() => import('./nodes/42'),
	() => import('./nodes/43')
];

export const server_loads = [2,3];

export const dictionary = {
		"/(main)": [~4,[2]],
		"/(main)/@[handle]": [~5,[2]],
		"/(main)/@[handle]/accounts": [~6,[2]],
		"/(main)/@[handle]/accounts/bookmark": [~7,[2]],
		"/(main)/@[handle]/accounts/community": [~8,[2]],
		"/(main)/@[handle]/accounts/event": [9,[2]],
		"/(main)/@[handle]/accounts/like": [~10,[2]],
		"/(main)/@[handle]/accounts/notice": [11,[2]],
		"/(main)/@[handle]/accounts/orders": [~12,[2]],
		"/(main)/@[handle]/accounts/point": [~13,[2]],
		"/(main)/@[handle]/accounts/profile": [14,[2]],
		"/(main)/@[handle]/accounts/profile/modify": [15,[2]],
		"/(main)/@[handle]/post/[post_id]": [~16,[2]],
		"/(main)/admin": [17,[2,3]],
		"/(main)/admin/account-transition": [18,[2,3]],
		"/(main)/admin/home": [19,[2,3]],
		"/(main)/admin/moon-charges": [~20,[2,3]],
		"/(main)/admin/withdrawals": [~21,[2,3]],
		"/(main)/auth/auth-code-error": [22,[2]],
		"/(main)/chat": [23,[2]],
		"/(main)/chat/[roomId]": [24,[2]],
		"/(main)/community": [~25,[2]],
		"/(main)/community/regi": [~27,[2]],
		"/(main)/community/regi/Set_avatar": [28,[2]],
		"/(main)/community/regi/Set_content": [29,[2]],
		"/(main)/community/regi/Set_topic": [30,[2]],
		"/(main)/community/[slug]": [~26,[2]],
		"/(main)/login": [31,[2]],
		"/(main)/regi/post": [~32,[2]],
		"/(main)/regi/post/[post_id]": [~33,[2]],
		"/(main)/regi/service": [~34,[2]],
		"/(main)/regi/service/[service_id]": [~35,[2]],
		"/(main)/search": [36,[2]],
		"/(main)/service": [~37,[2]],
		"/(main)/service/[id]": [~38,[2]],
		"/(main)/service/[id]/review": [39,[2]],
		"/(main)/sign-up": [~40,[2]],
		"/(main)/sign-up/Set_avatar": [41,[2]],
		"/(main)/sign-up/Set_basic": [42,[2]],
		"/(main)/sign-up/Set_personal": [43,[2]]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';