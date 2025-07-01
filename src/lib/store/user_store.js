import profile_png from '$lib/img/common/user/profile.png';
import { writable } from 'svelte/store';

export const user_store = writable({
	id: null,
	phone: '010-0000-0000',
	handle: '비회원',
	name: '비회원',
	avatar_url: profile_png,
	banner_url: '',
	gender: '남',
	birth_date: '2000-01-01',
	self_introduction: '비회원입니다.',
	moon_point: 0,
	rating: 0,
	website_url: '',
	user_follows: [], // 팔로잉 목록
	user_followers: [], // 팔로워 목록
});

export const update_user_store = (partial_obj) => {
	user_store.update((current) => ({
		...current,
		...partial_obj,
	}));
};
