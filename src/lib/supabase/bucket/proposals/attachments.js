export const create_proposal_attachments_bucket_api = (supabase) => ({
	// 파일 업로드
	upload: async (file_path, file) => {
		const { data, error } = await supabase.storage
			.from('proposals')
			.upload(`attachments/${file_path}`, file, {
				cacheControl: '3600',
				upsert: false,
			});

		if (error) {
			throw new Error(`제안서 첨부파일 업로드 실패: ${error.message}`);
		}

		return data;
	},

	// 여러 파일 동시 업로드
	upload_multiple: async (files_with_paths) => {
		const upload_promises = files_with_paths.map(({ path, file }) =>
			supabase.storage
				.from('proposals')
				.upload(`attachments/${path}`, file, {
					cacheControl: '3600',
					upsert: false,
				})
		);

		const results = await Promise.allSettled(upload_promises);

		const successful_uploads = [];
		const failed_uploads = [];

		results.forEach((result, index) => {
			if (result.status === 'fulfilled' && !result.value.error) {
				successful_uploads.push({
					index,
					path: files_with_paths[index].path,
					data: result.value.data
				});
			} else {
				failed_uploads.push({
					index,
					path: files_with_paths[index].path,
					error: result.value?.error || result.reason
				});
			}
		});

		if (failed_uploads.length > 0) {
			// 일부만 실패한 경우
			if (successful_uploads.length > 0) {
				console.warn('일부 파일 업로드 실패:', failed_uploads);
			} else {
				// 전체 실패
				throw new Error(`모든 파일 업로드 실패: ${failed_uploads[0].error.message}`);
			}
		}

		return { successful_uploads, failed_uploads };
	},

	// 파일 삭제
	remove: async (file_path) => {
		const { error } = await supabase.storage
			.from('proposals')
			.remove([`attachments/${file_path}`]);

		if (error) {
			throw new Error(`제안서 첨부파일 삭제 실패: ${error.message}`);
		}
	},

	// 여러 파일 동시 삭제
	remove_multiple: async (file_paths) => {
		const paths_with_prefix = file_paths.map(path => `attachments/${path}`);

		const { error } = await supabase.storage
			.from('proposals')
			.remove(paths_with_prefix);

		if (error) {
			throw new Error(`제안서 첨부파일 삭제 실패: ${error.message}`);
		}
	},

	// 공개 URL 가져오기
	get_public_url: (file_path) => {
		const { data } = supabase.storage
			.from('proposals')
			.getPublicUrl(`attachments/${file_path}`);

		return data.publicUrl;
	}
});
