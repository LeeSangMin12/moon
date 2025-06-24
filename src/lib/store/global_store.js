import { writable } from 'svelte/store';

export const is_login_prompt_modal = writable(false);
export const loading = writable(false);

const property_map_obj = {
	is_login_prompt_modal, //로그인 제안 모달
	loading,
};

/**
 * store 업데이트
 * @param {*} key
 * @param {*} val
 */
export const update_global_store = (key, val) => {
	const property_to_update = property_map_obj[key];

	if (property_to_update) {
		property_to_update.set(val);
	}
};
