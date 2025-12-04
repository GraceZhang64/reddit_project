import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PostFeed from '../components/PostFeed';
import SearchBar from '../components/SearchBar';
import PostSortFilter, { SortOption } from '../components/PostSortFilter';
import { postsApi, votesApi, followsApi } from '../services/api';
import { Post } from '../types';
import './HomePage.css';

type FeedType = 'all' | 'following';
type FollowingFilter = 'all' | 'users' | 'communities';

// Map API post to component Post type - moved outside to avoid recreation
const mapApiPost = (apiPost: any): Post => ({
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

// Extract user vote from API post
const getUserVoteFromPost = (apiPost: any): number => {
  return apiPost.user_vote ?? apiPost.userVote ?? 0;
};

function HomePage() {
  const [feed, setFeed] = useState<FeedType>('all');
  const [followingFilter, setFollowingFilter] = useState<FollowingFilter>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});
  const [sortOption, setSortOption] = useState<SortOption>('hot');

  useEffect(() => {
    if (searchQuery.trim()) return;
    const fetchPostsAndVotes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let response;
        if (feed === 'following') {
          response = await followsApi.getFollowingFeed(1, 20, followingFilter);
        } else {
          response = await postsApi.getAll(1, 20);
        }
        const fetchedPosts = response.posts || [];
        setPosts(fetchedPosts.map(mapApiPost));

        // Extract user votes from API response (already included, no need for separate calls)
        const votes: Record<number, number> = {};
        fetchedPosts.forEach((p: any) => {
          votes[p.id] = getUserVoteFromPost(p);
        });
        setUserVotes(votes);
      } catch (err: any) {
        setPosts([]);
        if (err.response?.status === 401) {
          setError('Authentication required. Please log in again.');
        } else if (feed === 'following' && err.response?.status === 404) {
          setError('Follow some users or join communities to see posts here!');
        } else {
          setError(err.response?.data?.error || 'Failed to load posts. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchPostsAndVotes();
  }, [feed, followingFilter, searchQuery]);

  const handleFeedChange = (newFeed: FeedType) => {
    setFeed(newFeed);
    setSearchQuery(''); // Clear search when changing feed
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
  };

  // Sort posts based on selected option (memoized to prevent unnecessary re-sorting)
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
    switch (sortOption) {
      case 'hot':
        // Sort by vote count descending (most upvotes first)
        return (b.voteCount || 0) - (a.voteCount || 0);
      case 'downvotes':
        // Sort by vote count ascending (most downvotes/lowest score first)
        return (a.voteCount || 0) - (b.voteCount || 0);
      case 'controversial':
        // Sort by comment count descending (most comments first)
        return (b.commentCount || 0) - (a.commentCount || 0);
      case 'new':
        // Sort by creation date descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        // Sort by creation date ascending (oldest first)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default:
        return 0;
    }
  });
  }, [posts, sortOption]);

  // Keyword search handler using API
  const handleSearch = async (query: string) => {
    console.log('🔎 handleSearch called with query:', query);
    setSearchQuery(query);
    if (!query.trim()) {
      // If search is cleared, reload feed via useEffect
      setIsSearching(false);
      setError(null);
      return;
    }
    // Perform keyword search via API
    console.log('🔍 Performing search for:', query);
    setIsSearching(true);
    setError(null);
    try {
      const response = await postsApi.search(query, 1, 50);
      console.log('✅ Search results:', response);
      const fetchedPosts = response.posts || [];
      console.log('📦 Search results count:', fetchedPosts.length);
      setPosts(fetchedPosts.map(mapApiPost));
    } catch (err) {
      console.error('❌ Error searching posts:', err);
      setError('Search failed. Please try again.');
      setPosts([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleVote = useCallback(async (postId: number, value: number) => {
    const oldVote = userVotes[postId] || 0;
    const newVote = oldVote === value ? 0 : value;
    const voteDiff = newVote - oldVote;
    
    // Optimistic update
    setUserVotes({ ...userVotes, [postId]: newVote });
    setPosts(
      posts.map((p) =>
        p.id === postId ? { ...p, voteCount: (p.voteCount || 0) + voteDiff } : p
      )
    );

    try {
      // Use new backend vote endpoint
      const result = await votesApi.votePost(postId, newVote as 1 | -1 | 0);
      setUserVotes({ ...userVotes, [postId]: result.user_vote ?? 0 });
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, voteCount: result.vote_count } : p
        )
      );
    } catch (err: any) {
      console.error('Error voting:', err);
      // Revert on error
      setUserVotes({ ...userVotes, [postId]: oldVote });
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, voteCount: (p.voteCount || 0) - voteDiff } : p
        )
      );
      alert(err.response?.data?.error || 'Failed to vote. Please make sure you are logged in.');
    }
  }, [posts, userVotes]);

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="feed-content">
          <div className="feed-selector">
            <button 
              className={`feed-tab ${feed === 'all' ? 'active' : ''}`}
              onClick={() => handleFeedChange('all')}
              disabled={!!searchQuery}
            >
              <span className="tab-icon">🌐</span>
              <span className="tab-text">All</span>
            </button>
            <button 
              className={`feed-tab ${feed === 'following' ? 'active' : ''}`}
              onClick={() => handleFeedChange('following')}
              disabled={!!searchQuery}
            >
              <span className="tab-icon">👥</span>
              <span className="tab-text">Following</span>
            </button>
          </div>

          {feed === 'following' && (
            <div className="following-filter" style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginTop: '1rem',
              marginBottom: '0.5rem',
              justifyContent: 'center'
            }}>
              <button
                className={`filter-btn ${followingFilter === 'all' ? 'active' : ''}`}
                onClick={() => setFollowingFilter('all')}
                disabled={!!searchQuery}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid var(--blueit-border)',
                  backgroundColor: followingFilter === 'all' ? 'var(--blueit-primary)' : 'transparent',
                  color: followingFilter === 'all' ? 'white' : 'var(--blueit-text)',
                  cursor: searchQuery ? 'not-allowed' : 'pointer',
                  opacity: searchQuery ? 0.5 : 1
                }}
              >
                All
              </button>
              <button
                className={`filter-btn ${followingFilter === 'users' ? 'active' : ''}`}
                onClick={() => setFollowingFilter('users')}
                disabled={!!searchQuery}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid var(--blueit-border)',
                  backgroundColor: followingFilter === 'users' ? 'var(--blueit-primary)' : 'transparent',
                  color: followingFilter === 'users' ? 'white' : 'var(--blueit-text)',
                  cursor: searchQuery ? 'not-allowed' : 'pointer',
                  opacity: searchQuery ? 0.5 : 1
                }}
              >
                Users
              </button>
              <button
                className={`filter-btn ${followingFilter === 'communities' ? 'active' : ''}`}
                onClick={() => setFollowingFilter('communities')}
                disabled={!!searchQuery}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid var(--blueit-border)',
                  backgroundColor: followingFilter === 'communities' ? 'var(--blueit-primary)' : 'transparent',
                  color: followingFilter === 'communities' ? 'white' : 'var(--blueit-text)',
                  cursor: searchQuery ? 'not-allowed' : 'pointer',
                  opacity: searchQuery ? 0.5 : 1
                }}
              >
                Communities
              </button>
            </div>
          )}

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search posts by keywords, title, or content..."
              showResultCount={searchQuery.length > 0}
              resultCount={posts.length}
            />
            {searchQuery && (
              <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                <Link to="/search" style={{ fontSize: '0.9rem', color: 'var(--blueit-primary)' }}>
                  Advanced search (search comments too) →
                </Link>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '0.5rem', marginTop: '0.5rem' }}>
            <PostSortFilter 
              currentSort={sortOption}
              onSortChange={handleSortChange}
              disabled={isLoading || isSearching}
            />
          </div>

          <div className="feed-description">
            {searchQuery ? (
              <p>Search results for "{searchQuery}"</p>
            ) : (
              <p>
                {(() => {
                  switch (sortOption) {
                    case 'hot':
                      return 'The most upvoted posts across all communities';
                    case 'downvotes':
                      return 'Posts with the most downvotes (lowest scores)';
                    case 'controversial':
                      return 'Posts with the most comments across all communities';
                    case 'new':
                      return 'The newest posts from all communities';
                    case 'oldest':
                      return 'The oldest posts from all communities';
                    default:
                      return 'All posts from BlueIt communities';
                  }
                })()}
              </p>
            )}
          </div>

          {isLoading || isSearching ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--blueit-text-secondary)' }}>
              <p>Loading posts...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--blueit-error)' }}>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                style={{ marginTop: '1rem' }}
              >
                Retry
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--blueit-text-secondary)' }}>
              {feed === 'following' ? (
                <>
                  {followingFilter === 'users' ? (
                <>
                  <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>👥 No posts from followed users yet</p>
                  <p style={{ fontSize: '0.9rem' }}>Follow some users to see their posts here!</p>
                    </>
                  ) : followingFilter === 'communities' ? (
                    <>
                      <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🏘️ No posts from your communities yet</p>
                      <p style={{ fontSize: '0.9rem' }}>Join some communities to see their posts here!</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>👥 No posts from followed users or communities yet</p>
                      <p style={{ fontSize: '0.9rem' }}>Follow some users or join communities to see posts here!</p>
                    </>
                  )}
                  <Link to="/communities" style={{ 
                    display: 'inline-block',
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--blueit-primary)',
                    color: 'white',
                    borderRadius: '4px',
                    textDecoration: 'none'
                  }}>
                    Explore Communities
                  </Link>
                </>
              ) : (
              <p>No posts found. Be the first to post!</p>
              )}
            </div>
          ) : (
            <PostFeed posts={sortedPosts} onVote={handleVote} userVotes={userVotes} />
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;

