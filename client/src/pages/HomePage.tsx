import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PostFeed from '../components/PostFeed';
import SearchBar from '../components/SearchBar';
import { postsApi, votesApi, followsApi } from '../services/api';
import { Post } from '../types';
import './HomePage.css';

type FeedType = 'all' | 'hot' | 'following';

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

function HomePage() {
  const [feed, setFeed] = useState<FeedType>('hot');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});

  useEffect(() => {
    const fetchPosts = async () => {
      console.log('🔍 HomePage useEffect triggered', { feed, searchQuery: searchQuery.trim() });
      
      // Only fetch if not currently searching
      if (searchQuery.trim()) {
        console.log('⏭️ Skipping fetch because searchQuery exists:', searchQuery);
        return;
      }
      
      console.log('📡 Fetching posts for feed:', feed);
      setIsLoading(true);
      setError(null);
      try {
        let response;
        if (feed === 'hot') {
          response = await postsApi.getHot(1, 20);
        } else if (feed === 'following') {
          response = await followsApi.getFollowingFeed(1, 20);
        } else {
          response = await postsApi.getAll(1, 20);
        }
        
        console.log('✅ Posts fetched successfully:', response);
        const fetchedPosts = response.posts || [];
        console.log('📦 Mapped posts count:', fetchedPosts.length);
        
        // Check if no posts in following feed
        if (feed === 'following' && fetchedPosts.length === 0) {
          console.log('ℹ️ No posts from followed users');
        }
        
        setPosts(fetchedPosts.map(mapApiPost));
      } catch (err: any) {
        console.error('❌ Error fetching posts:', err);
        console.error('Error details:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message
        });
        
        // Better error messages
        if (err.response?.status === 401) {
          setError('Authentication required. Please log in again.');
        } else if (feed === 'following' && err.response?.status === 404) {
          setError('Follow some users to see their posts here!');
        } else {
          setError(err.response?.data?.error || 'Failed to load posts. Please try again.');
        }
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [feed, searchQuery]);

  const handleFeedChange = (newFeed: FeedType) => {
    setFeed(newFeed);
    setSearchQuery(''); // Clear search when changing feed
  };

  // Keyword search handler using API
  const handleSearch = async (query: string) => {
    console.log('🔎 handleSearch called with query:', query);
    setSearchQuery(query);
    
    if (!query.trim()) {
      console.log('🔄 Search cleared, letting useEffect handle reload');
      // Let the useEffect handle the reload when searchQuery is cleared
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

  const handleVote = async (postId: number, value: number) => {
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
      if (newVote === 0) {
        // Remove vote
        await votesApi.remove('post', postId);
      } else {
        // Cast vote
        await votesApi.cast({
          target_type: 'post',
          target_id: postId,
          value: newVote as 1 | -1,
        });
      }
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
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="feed-content">
          <div className="feed-selector">
            <button 
              className={`feed-tab ${feed === 'hot' ? 'active' : ''}`}
              onClick={() => handleFeedChange('hot')}
              disabled={!!searchQuery}
            >
              <span className="tab-icon">🔥</span>
              <span className="tab-text">Hot</span>
            </button>
            <button 
              className={`feed-tab ${feed === 'following' ? 'active' : ''}`}
              onClick={() => handleFeedChange('following')}
              disabled={!!searchQuery}
            >
              <span className="tab-icon">👥</span>
              <span className="tab-text">Following</span>
            </button>
            <button 
              className={`feed-tab ${feed === 'all' ? 'active' : ''}`}
              onClick={() => handleFeedChange('all')}
              disabled={!!searchQuery}
            >
              <span className="tab-icon">🌐</span>
              <span className="tab-text">All</span>
            </button>
          </div>

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

          <div className="feed-description">
            {searchQuery ? (
              <p>Search results for "{searchQuery}"</p>
            ) : feed === 'hot' ? (
              <p>The most upvoted posts across all communities</p>
            ) : feed === 'following' ? (
              <p>Posts from users you follow</p>
            ) : (
              <p>All posts from BlueIt communities</p>
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
                  <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>👥 No posts from followed users yet</p>
                  <p style={{ fontSize: '0.9rem' }}>Follow some users to see their posts here!</p>
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
            <PostFeed posts={posts} onVote={handleVote} />
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;

