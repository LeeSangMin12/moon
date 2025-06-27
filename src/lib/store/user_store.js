import { writable } from 'svelte/store';

export const user_store = writable({
	id: '',
	phone: '',
	handle: '',
	name: '',
	avatar_url: '',
	banner_url: '',
	gender: '',
	birth_date: '',
	self_introduction: '',
	moon_point: 0,
	rating: 0,
	user_follows: [], // 팔로잉 목록
	user_followers: [], // 팔로워 목록
});

export const update_user_store = (partial_obj) => {
	user_store.update((current) => ({
		...current,
		...partial_obj,
	}));
};
