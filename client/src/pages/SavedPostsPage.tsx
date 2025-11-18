import { useState, useEffect } from 'react';
import { savedPostsApi } from '../services/api';
import { Post } from '../types';
import PostCard from '../components/PostCard';
import PostSortFilter, { SortOption } from '../components/PostSortFilter';
import './SavedPostsPage.css';

function SavedPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [savedStatuses, setSavedStatuses] = useState<Record<number, boolean>>({});
  const [sortOption, setSortOption] = useState<SortOption>('new');

  useEffect(() => {
    fetchSavedPosts();
  }, [page]);

  const fetchSavedPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await savedPostsApi.getSavedPosts(page, 20);
      
      if (response.posts) {
        // Map API posts to component Post type
        const mappedPosts: Post[] = response.posts.map((apiPost: any) => ({
          id: apiPost.id,
          slug: apiPost.slug,
          title: apiPost.title,
          body: apiPost.body,
          post_type: apiPost.post_type,
          link_url: apiPost.link_url,
          image_url: apiPost.image_url,
          video_url: apiPost.video_url,
          media_urls: apiPost.media_urls,
          crosspost_id: apiPost.crosspost_id,
          author: apiPost.author?.username || apiPost.author || 'Unknown',
          communityId: apiPost.community?.id || apiPost.communityId || 0,
          communityName: apiPost.community?.name || apiPost.communityName || 'Unknown',
          communitySlug: apiPost.community?.slug || apiPost.communitySlug,
          voteCount: apiPost.voteCount || 0,
          commentCount: apiPost.commentCount || 0,
          createdAt: apiPost.createdAt,
          aiSummary: apiPost.ai_summary || apiPost.aiSummary,
        }));
        
        setPosts(mappedPosts);
        setTotalPages(response.pagination.totalPages);
        
        // Initialize all posts as saved
        const statuses: Record<number, boolean> = {};
        mappedPosts.forEach(post => {
          statuses[post.id] = true;
        });
        setSavedStatuses(statuses);
      }
    } catch (err: any) {
      console.error('Error fetching saved posts:', err);
      if (err.response?.status === 404 || err.response?.status === 500) {
        setError('Saved posts feature is not yet set up. Please run the database migration.');
      } else {
        setError(err.response?.data?.error || 'Failed to load saved posts');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToggle = (postId: number, saved: boolean) => {
    setSavedStatuses(prev => ({ ...prev, [postId]: saved }));
    
    // If unsaved, remove from the list after a short delay for UX
    if (!saved) {
      setTimeout(() => {
        setPosts(prev => prev.filter(post => post.id !== postId));
      }, 300);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
  };

  // Sort posts based on selected option
  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortOption) {
      case 'hot':
      case 'top':
        // Sort by vote count descending (most upvotes first)
        return (b.voteCount || 0) - (a.voteCount || 0);
      case 'new':
        // Sort by creation date descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        // Sort by creation date ascending (oldest first)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'controversial':
        // Sort by vote count ascending (most downvotes/lowest score first)
        return (a.voteCount || 0) - (b.voteCount || 0);
      default:
        return 0;
    }
  });

  if (loading && posts.length === 0) {
    return (
      <div className="saved-posts-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your saved posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="saved-posts-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchSavedPosts} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-posts-page">
      <div className="page-header">
        <h1>📑 Saved Posts</h1>
        <p className="subtitle">
          {posts.length === 0 
            ? "You haven't saved any posts yet" 
            : `${posts.length} saved post${posts.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📑</div>
          <h2>No saved posts yet</h2>
          <p>Posts you save will appear here so you can easily find them later.</p>
          <p className="hint">Look for the "Save" button on any post to bookmark it!</p>
        </div>
      ) : (
        <>
          <PostSortFilter 
            currentSort={sortOption}
            onSortChange={handleSortChange}
            disabled={loading}
          />
          
          <div className="posts-container">
            {sortedPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post}
                initialSaved={savedStatuses[post.id] ?? true}
                onSaveToggle={handleSaveToggle}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SavedPostsPage;
