import { create_community_avatars_api } from '$lib/supabase/bucket/communities/avatars';
import { create_post_images_api } from '$lib/supabase/bucket/posts/images';
import { create_service_images_api } from '$lib/supabase/bucket/services/images';
import { create_user_avatars_api } from '$lib/supabase/bucket/users/avatars';
import { create_communities_api } from '$lib/supabase/communities';
import { create_community_members_api } from '$lib/supabase/community_members';
import { create_community_reports_api } from '$lib/supabase/community_reports';
import { create_community_topics_api } from '$lib/supabase/community_topics';
import { create_moon_charges_api } from '$lib/supabase/moon_charges';
import { create_post_bookmarks_api } from '$lib/supabase/post_bookmarks';
import { create_post_comment_votes_api } from '$lib/supabase/post_comment_votes';
import { create_post_comments_api } from '$lib/supabase/post_comments';
import { create_post_reports_api } from '$lib/supabase/post_reports';
import { create_post_votes_api } from '$lib/supabase/post_votes';
import { create_posts_api } from '$lib/supabase/posts';
import { create_service_likes_api } from '$lib/supabase/service_likes';
import { create_services_api } from '$lib/supabase/services';
import { create_topics_api } from '$lib/supabase/topics';
import { create_user_follows_api } from '$lib/supabase/user_follows';
import { create_users_api } from '$lib/supabase/users';

export const create_api = (supabase) => ({
	communities: create_communities_api(supabase),
	community_members: create_community_members_api(supabase),
	community_reports: create_community_reports_api(supabase),
	community_topics: create_community_topics_api(supabase),
	moon_charges: create_moon_charges_api(supabase),
	post_bookmarks: create_post_bookmarks_api(supabase),
	post_comment_votes: create_post_comment_votes_api(supabase),
	post_comments: create_post_comments_api(supabase),
	post_reports: create_post_reports_api(supabase),
	post_votes: create_post_votes_api(supabase),
	posts: create_posts_api(supabase),
	services: create_services_api(supabase),
	service_likes: create_service_likes_api(supabase),
	topics: create_topics_api(supabase),
	user_follows: create_user_follows_api(supabase),
	users: create_users_api(supabase),
	//bucket
	community_avatars: create_community_avatars_api(supabase),
	user_avatars: create_user_avatars_api(supabase),
	post_images: create_post_images_api(supabase),
	service_images: create_service_images_api(supabase),
});
