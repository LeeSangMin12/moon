import { has_invalid_args } from '$lib/utils/common';

export const create_community_avatars_api = (supabase) => ({
	upload: async (file_path, community_avatar_url) => {
		let { error } = await supabase.storage
			.from('communities')
			.upload(`avatars/${file_path}`, community_avatar_url);

		if (error)
			throw new Error(`Failed to upload_community_avatars: ${error.message}`);
	},
});
