export const create_user_avatars_api = (supabase) => ({
	upload: async (file_path, user_avatar_url) => {
		let { error } = await supabase.storage
			.from('users')
			.upload(file_path, user_avatar_url);

		if (error)
			throw new Error(`Failed to upload_user_avatars: ${error.message}`);
	},
});
