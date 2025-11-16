import { useState, useEffect } from 'react';
import PostFeed from '../components/PostFeed';
import { Post as ApiPost, postsApi } from '../services/api';
import { Post } from '../types';
import './HomePage.css';

type FeedType = 'all' | 'hot' | 'following';

function HomePage() {
  const [feed, setFeed] = useState<FeedType>('hot');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map API post to component Post type
  const mapApiPost = (apiPost: ApiPost): Post => ({
    id: apiPost.id,
    slug: apiPost.slug || undefined,
    title: apiPost.title,
    body: apiPost.body || undefined,
    author: apiPost.author.username,
    communityId: apiPost.community.id,
    communityName: apiPost.community.name,
    communitySlug: apiPost.community.slug,
    voteCount: apiPost.voteCount,
    commentCount: apiPost.commentCount,
    createdAt: apiPost.createdAt,
    aiSummary: apiPost.ai_summary || undefined,
  });

  useEffect(() => {
    const fetchPosts = async () => {
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
  }, [feed]);

  const handleFeedChange = (newFeed: FeedType) => {
    setFeed(newFeed);
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="feed-content">
          <div className="feed-selector">
            <button 
              className={`feed-tab ${feed === 'hot' ? 'active' : ''}`}
              onClick={() => handleFeedChange('hot')}
            >
              <span className="tab-icon">🔥</span>
              <span className="tab-text">Hot</span>
            </button>
            <button 
              className={`feed-tab ${feed === 'all' ? 'active' : ''}`}
              onClick={() => handleFeedChange('all')}
            >
              <span className="tab-icon">🌐</span>
              <span className="tab-text">All</span>
            </button>
          </div>

          <div className="feed-description">
            {feed === 'hot' ? (
              <p>The most upvoted posts across all communities</p>
            ) : (
              <p>All posts from BlueIt communities</p>
            )}
          </div>

          {isLoading ? (
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
            <PostFeed posts={posts} />
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

