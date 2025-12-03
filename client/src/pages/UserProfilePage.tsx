import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersApi, followsApi, Community, Post as ApiPost, Comment as ApiComment } from '../services/api';
import FollowButton from '../components/FollowButton';
import PostCard from '../components/PostCard';
import { Post } from '../types';
import './UserProfilePage.css';

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  karma: number;
  createdAt: string;
}

type ProfileTab = 'posts' | 'comments';

// Map API post (from /users/:username/posts) into shared Post type
const mapUserApiPost = (apiPost: any): Post => ({
  id: apiPost.id,
  slug: apiPost.slug || undefined,
  title: apiPost.title,
  body: apiPost.body || undefined,
  post_type: apiPost.post_type || apiPost.postType || 'text',
  link_url: apiPost.link_url || apiPost.linkUrl || undefined,
  author: apiPost.author?.username || 'Unknown',
  communityId: apiPost.community?.id || 0,
  communityName: apiPost.community?.name || 'Unknown',
  communitySlug: apiPost.community?.slug,
  voteCount: apiPost.voteCount || apiPost.vote_count || 0,
  commentCount: apiPost.commentCount || apiPost.comment_count || 0,
  createdAt: apiPost.createdAt || apiPost.created_at,
  aiSummary: apiPost.ai_summary || undefined,
});

function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username');
  const isOwnProfile = currentUser === username;

  useEffect(() => {
    if (username) {
      fetchUserProfile();
      fetchFollowCounts();
      fetchUserCommunities();
      fetchUserPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      const data = await usersApi.getProfile(username!);

      if (data && data.username) {
        setProfile({
          id: data.id,
          username: data.username,
          avatar_url: data.avatar_url,
          bio: data.bio,
          karma: data.karma || 0,
          createdAt: data.createdAt,
        });
      } else {
        setError('Invalid profile data received');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load user profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const [followersData, followingData] = await Promise.all([
        followsApi.getFollowers(username!, 1, 1),
        followsApi.getFollowing(username!, 1, 1),
      ]);
      setFollowerCount(followersData.pagination.total);
      setFollowingCount(followingData.pagination.total);
    } catch (err) {
      console.error('Error fetching follow counts:', err);
    }
  };

  const fetchUserCommunities = async () => {
    try {
      const data = await usersApi.getCommunities(username!);
      setCommunities(data.communities || []);
    } catch (err) {
      console.error('Error fetching communities:', err);
    }
  };

  const fetchUserPosts = async () => {
    setPostsLoading(true);
    try {
      const data = await usersApi.getPosts(username!, 1, 50);
      const apiPosts: ApiPost[] = (data.posts || []) as any;
      setPosts(apiPosts.map(mapUserApiPost));
    } catch (err) {
      console.error('Error fetching user posts:', err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchUserComments = async () => {
    setCommentsLoading(true);
    try {
      const data = await usersApi.getComments(username!, 1, 50);
      const apiComments: ApiComment[] = (data.comments || []) as any;
      setComments(apiComments);
    } catch (err) {
      console.error('Error fetching user comments:', err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleFollowChange = (isFollowing: boolean) => {
    setFollowerCount((prev) => (isFollowing ? prev + 1 : Math.max(prev - 1, 0)));
  };

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    if (tab === 'posts' && posts.length === 0 && !postsLoading) {
      fetchUserPosts();
    }
    if (tab === 'comments' && comments.length === 0 && !commentsLoading) {
      fetchUserComments();
    }
  };

  if (loading) {
    return (
      <div className="user-profile-page">
        <div className="profile-container">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="user-profile-page">
        <div className="profile-container">
          <p style={{ color: '#c33' }}>{error || 'User not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} />
            ) : (
              <div className="avatar-placeholder">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-info">
            <div className="profile-title-row">
              <h1>u/{profile.username}</h1>
              {!isOwnProfile && (
                <FollowButton username={profile.username} onFollowChange={handleFollowChange} />
              )}
            </div>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-stats">
              <div className="stat">
                <strong>{profile.karma.toLocaleString()}</strong>
                <span>Karma</span>
              </div>
              <div className="stat">
                <strong>{followerCount.toLocaleString()}</strong>
                <span>Followers</span>
              </div>
              <div className="stat">
                <strong>{followingCount.toLocaleString()}</strong>
                <span>Following</span>
              </div>
              <div className="stat">
                <strong>{new Date(profile.createdAt).toLocaleDateString()}</strong>
                <span>Joined</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2 className="section-title">Communities</h2>
          {communities.length > 0 ? (
            <div className="communities-grid">
              {communities.map((community) => (
                <Link 
                  key={community.id} 
                  to={`/c/${community.slug}`}
                  className="community-card"
                >
                  <div className="community-card-header">
                    <span className="community-icon">🏘️</span>
                    <h3>c/{community.name}</h3>
                  </div>
                  {community.description && (
                    <p className="community-description">{community.description}</p>
                  )}
                  <div className="community-meta">
                    <span>👥 {community.memberCount || 0} members</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--blueit-text-secondary)' }}>
              No communities created yet
            </p>
          )}
        </div>

        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => handleTabChange('posts')}
          >
            Posts
          </button>
          <button
            className={`profile-tab ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => handleTabChange('comments')}
          >
            Comments
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'posts' ? (
            postsLoading ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>Loading posts...</p>
            ) : posts.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--blueit-text-secondary)' }}>
                No posts yet
              </p>
            ) : (
              <div className="profile-posts-list">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )
          ) : commentsLoading ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>Loading comments...</p>
          ) : comments.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--blueit-text-secondary)' }}>
              No comments yet
            </p>
          ) : (
            <div className="profile-comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="profile-comment-card">
                  <div className="profile-comment-meta">
                    <span>
                      In{' '}
                      <Link to={`/c/${comment.post.community?.slug}`}>
                        c/{comment.post.community?.slug}
                      </Link>
                    </span>
                    <span> • {new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Link to={`/p/${comment.post.id}`} className="profile-comment-post-title">
                    {comment.post.title}
                  </Link>
                  <p className="profile-comment-body">{comment.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;


