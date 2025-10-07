import { create_community_avatars_api } from '$lib/supabase/bucket/communities/avatars';
import { create_post_images_api } from '$lib/supabase/bucket/posts/images';
import { create_service_images_api } from '$lib/supabase/bucket/services/images';
import { create_user_avatars_api } from '$lib/supabase/bucket/users/avatars';
import { create_communities_api } from '$lib/supabase/communities';
import { create_community_members_api } from '$lib/supabase/community_members';
import { create_community_reports_api } from '$lib/supabase/community_reports';
import { create_community_topics_api } from '$lib/supabase/community_topics';
import { create_moon_charges_api } from '$lib/supabase/moon_charges';
import { create_moon_point_transactions_api } from '$lib/supabase/moon_point_transactions';
import { create_moon_withdrawals_api } from '$lib/supabase/moon_withdrawals';
import { create_notifications_api } from '$lib/supabase/notifications';
import { create_post_bookmarks_api } from '$lib/supabase/post_bookmarks';
import { create_post_comment_votes_api } from '$lib/supabase/post_comment_votes';
import { create_post_comments_api } from '$lib/supabase/post_comments';
import { create_post_reports_api } from '$lib/supabase/post_reports';
import { create_post_votes_api } from '$lib/supabase/post_votes';
import { create_posts_api } from '$lib/supabase/posts';
import { create_service_likes_api } from '$lib/supabase/service_likes';
import { create_service_orders_api } from '$lib/supabase/service_orders';
import { create_service_reviews_api } from '$lib/supabase/service_reviews';
import { create_services_api } from '$lib/supabase/services';
import { create_topics_api } from '$lib/supabase/topics';
import { create_user_follows_api } from '$lib/supabase/user_follows';
import { create_user_reports_api } from '$lib/supabase/user_reports';
import { create_users_api } from '$lib/supabase/users';
import { create_expert_requests_api } from '$lib/supabase/expert_requests';
import { create_expert_request_proposals_api } from '$lib/supabase/expert_request_proposals';
import { create_expert_request_reviews_api } from '$lib/supabase/expert_request_reviews';
import { create_proposal_attachments_api } from '$lib/supabase/proposal_attachments';
import { create_coffee_chats_api } from '$lib/supabase/coffee_chats';
import { create_proposal_attachments_bucket_api } from '$lib/supabase/bucket/proposals/attachments';

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
	service_orders: create_service_orders_api(supabase),
	service_reviews: create_service_reviews_api(supabase),
	topics: create_topics_api(supabase),
	user_follows: create_user_follows_api(supabase),
	users: create_users_api(supabase),
	user_reports: create_user_reports_api(supabase),
	moon_point_transactions: create_moon_point_transactions_api(supabase),
	moon_withdrawals: create_moon_withdrawals_api(supabase),
	notifications: create_notifications_api(supabase),
	expert_requests: create_expert_requests_api(supabase),
	expert_request_proposals: create_expert_request_proposals_api(supabase),
	expert_request_reviews: create_expert_request_reviews_api(supabase),
	proposal_attachments: create_proposal_attachments_api(supabase),
	coffee_chats: create_coffee_chats_api(supabase),
	//bucket
	community_avatars: create_community_avatars_api(supabase),
	user_avatars: create_user_avatars_api(supabase),
	post_images: create_post_images_api(supabase),
	service_images: create_service_images_api(supabase),
	proposal_attachments_bucket: create_proposal_attachments_bucket_api(supabase),
});
