import { createClient } from '@supabase/supabase-js';
import { fail } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

export const actions = {
	create: async ({ request }) => {
		try {
			// Service Role 클라이언트 생성 (auth.users 생성 권한 필요)
			const supabaseAdmin = createClient(
				PUBLIC_SUPABASE_URL,
				SUPABASE_SERVICE_ROLE_KEY,
				{
					auth: {
						autoRefreshToken: false,
						persistSession: false,
					},
				}
			);

			const formData = await request.formData();
			const accountsJson = formData.get('accounts');

			if (!accountsJson) {
				return fail(400, { error: '계정 정보가 필요합니다.' });
			}

			const accounts = JSON.parse(accountsJson);

			if (!Array.isArray(accounts) || accounts.length === 0) {
				return fail(400, { error: '최소 1개 이상의 계정이 필요합니다.' });
			}

			// 각 계정 검증
			for (const account of accounts) {
				if (
					!account.email ||
					!account.password ||
					!account.name ||
					!account.handle
				) {
					return fail(400, {
						error: '모든 계정은 email, password, name, handle이 필요합니다.',
					});
				}
			}

			const results = [];
			const errors = [];

			// 계정 생성
			for (const account of accounts) {
				try {
					// handle 중복 체크
					const { data: existingUser } = await supabaseAdmin
						.from('users')
						.select('handle')
						.eq('handle', account.handle)
						.single();

					if (existingUser) {
						errors.push({
							email: account.email,
							handle: account.handle,
							error: 'Handle이 이미 존재합니다.',
						});
						continue;
					}

					// auth.users 생성
					const { data: authData, error: authError } =
						await supabaseAdmin.auth.admin.createUser({
							email: account.email,
							password: account.password,
							email_confirm: true, // 이메일 인증 자동 완료
						});

					if (authError) {
						errors.push({
							email: account.email,
							handle: account.handle,
							error: authError.message,
						});
						continue;
					}

					// public.users 테이블 업데이트
					const { error: updateError } = await supabaseAdmin
						.from('users')
						.update({
							name: account.name,
							handle: account.handle,
						})
						.eq('id', authData.user.id);

					if (updateError) {
						// 실패 시 auth.users 삭제 (rollback)
						await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
						errors.push({
							email: account.email,
							handle: account.handle,
							error: updateError.message,
						});
						continue;
					}

					results.push({
						email: account.email,
						handle: account.handle,
						user_id: authData.user.id,
						success: true,
					});
				} catch (err) {
					errors.push({
						email: account.email,
						handle: account.handle,
						error: err instanceof Error ? err.message : '알 수 없는 오류',
					});
				}
			}

			return {
				success: true,
				created: results.length,
				failed: errors.length,
				results,
				errors,
			};
		} catch (error) {
			console.error('Bulk account creation error:', error);
			return fail(500, {
				error: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
			});
		}
	},
};
