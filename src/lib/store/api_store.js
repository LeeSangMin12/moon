import { writable } from 'svelte/store';

export const api_store = writable({});

export const update_api_store = (partial_obj) => {
	api_store.update((current) => ({
		...current,
		...partial_obj,
	}));
};
