import { useState, useEffect } from 'react';
import PostCard from './PostCard';
import { Post } from '../types';
import { savedPostsApi } from '../services/api';
import './PostFeed.css';

interface PostFeedProps {
  posts: Post[];
  onVote?: (postId: number, value: number) => void;
}

function PostFeed({ posts, onVote }: PostFeedProps) {
  const [savedStatuses, setSavedStatuses] = useState<Record<number, boolean>>({});
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  useEffect(() => {
    const fetchSavedStatuses = async () => {
      if (posts.length === 0) {
        setIsLoadingSaved(false);
        // Set empty statuses for UI to work
        setSavedStatuses({});
        return;
      }

      setIsLoadingSaved(true);
      try {
        const postIds = posts.map(p => p.id);
        if (postIds.length > 0) {
          const statuses = await savedPostsApi.checkMultipleSaved(postIds);
          setSavedStatuses(statuses);
        } else {
          setSavedStatuses({});
        }
      } catch (error: any) {
        console.warn('Saved posts feature not available:', error.response?.status === 404 ? 'Endpoint not found' : error.message);
        // Silently fail - saved posts feature may not be set up yet
        // Set all statuses to false so UI still works
        const emptyStatuses: Record<number, boolean> = {};
        posts.forEach(p => {
          emptyStatuses[p.id] = false;
        });
        setSavedStatuses(emptyStatuses);
      } finally {
        setIsLoadingSaved(false);
      }
    };

    fetchSavedStatuses();
  }, [posts]);

  const handleSaveToggle = (postId: number, saved: boolean) => {
    setSavedStatuses(prev => ({ ...prev, [postId]: saved }));
  };

  return (
    <div className="post-feed">
      {posts.length > 0 ? (
        posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onVote={onVote}
            initialSaved={savedStatuses[post.id] ?? false}
            onSaveToggle={handleSaveToggle}
          />
        ))
      ) : (
        <div className="empty-feed">
          <p>No posts yet. Be the first to create one!</p>
        </div>
      )}
    </div>
  );
}

export default PostFeed;
