-- Performance optimization indexes for Reddit clone
-- Run this migration to improve query performance

-- Posts table indexes
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id_created ON posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_vote_count ON posts(vote_count DESC);

-- Comments table indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_vote_count ON comments(vote_count DESC);

-- Votes table indexes (for N+1 query optimization)
CREATE INDEX IF NOT EXISTS idx_votes_target_composite ON votes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_target ON votes(user_id, target_type, target_id);

-- Communities table indexes
CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_created_by ON communities(created_by);

-- User follows indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_composite ON user_follows(follower_id, following_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Poll votes indexes
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_option ON poll_votes(poll_option_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON poll_votes(user_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_posts_community_votes ON posts(community_id, vote_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON comments(post_id, parent_comment_id, created_at DESC);

-- Analyze tables to update statistics
ANALYZE posts;
ANALYZE comments;
ANALYZE votes;
ANALYZE communities;
ANALYZE users;

