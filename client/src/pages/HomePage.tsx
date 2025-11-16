import { useState, useEffect } from 'react';
import PostFeed from '../components/PostFeed';
import SearchBar from '../components/SearchBar';
import { Post as ApiPost, postsApi, votesApi } from '../services/api';
import { Post } from '../types';
import './HomePage.css';

type FeedType = 'all' | 'hot' | 'following';

function HomePage() {
  const [feed, setFeed] = useState<FeedType>('hot');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});

  // Map API post to component Post type
  const mapApiPost = (apiPost: any): Post => ({
    id: apiPost.id,
    slug: apiPost.slug || undefined,
    title: apiPost.title,
    body: apiPost.body || undefined,
    author: apiPost.author?.username || 'Unknown',
    communityId: apiPost.community?.id || 0,
    communityName: apiPost.community?.name || 'Unknown',
    communitySlug: apiPost.community?.slug,
    voteCount: apiPost.voteCount || apiPost.vote_count || 0,
    commentCount: apiPost.commentCount || apiPost.comment_count || 0,
    createdAt: apiPost.createdAt || apiPost.created_at,
    aiSummary: apiPost.ai_summary || undefined,
  });

  useEffect(() => {
    const fetchPosts = async () => {
      // Don't fetch feed posts when actively searching
      if (searchQuery) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const response = feed === 'hot' 
          ? await postsApi.getHot(1, 20)
          : await postsApi.getAll(1, 20);
        
        const fetchedPosts = response.posts || [];
        setPosts(fetchedPosts.map(mapApiPost));
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again.');
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
    setSearchQuery(query);
    
    if (!query.trim()) {
      // Reload the current feed when search is cleared
      setIsLoading(true);
      try {
        const response = feed === 'hot' 
          ? await postsApi.getHot(1, 20)
          : await postsApi.getAll(1, 20);
        
        const fetchedPosts = response.posts || [];
        setPosts(fetchedPosts.map(mapApiPost));
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again.');
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Perform keyword search via API
    setIsSearching(true);
    setError(null);
    try {
      const response = await postsApi.search(query, 1, 50);
      const fetchedPosts = response.posts || [];
      setPosts(fetchedPosts.map(mapApiPost));
    } catch (err) {
      console.error('Error searching posts:', err);
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
          </div>

          <div className="feed-description">
            {searchQuery ? (
              <p>Search results for "{searchQuery}"</p>
            ) : feed === 'hot' ? (
              <p>The most upvoted posts across all communities</p>
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
              <p>No posts found. Be the first to post!</p>
            </div>
          ) : (
            <PostFeed posts={posts} onVote={handleVote} />
          )}
        </div>

        <div className="home-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-header">
              <h3>Home</h3>
            </div>
            <p className="sidebar-description">
              Your personal BlueIt frontpage. See posts from communities you've joined.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;

