import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../types';
import VoteButtons from './VoteButtons';
import PostContent from './PostContent';
import AISummaryContent from './AISummaryContent';
import { followsApi, savedPostsApi } from '../services/api';
import './PostCard.css';

interface PostCardProps {
  post: Post;
  onVote?: (postId: number, value: number) => void;
  userVote?: number;
  initialSaved?: boolean;
  onSaveToggle?: (postId: number, saved: boolean) => void;
}

function PostCard({ post, onVote, userVote = 0, initialSaved = false, onSaveToggle }: PostCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);
  const currentUser = localStorage.getItem('username');
  const isOwnPost = currentUser === post.author;

  // Check follow status on mount
  useEffect(() => {
    if (!isOwnPost && currentUser) {
      checkFollowStatus();
    }
  }, [post.author]);

  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  const checkFollowStatus = async () => {
    try {
      const result = await followsApi.checkFollowing(post.author);
      setIsFollowing(result.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleUpvote = () => {
    if (onVote) {
      // Toggle upvote: if already upvoted, remove vote; otherwise upvote
      onVote(post.id, userVote === 1 ? 0 : 1);
    }
  };

  const handleDownvote = () => {
    if (onVote) {
      // Toggle downvote: if already downvoted, remove vote; otherwise downvote
      onVote(post.id, userVote === -1 ? 0 : -1);
    }
  };

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      alert('Please log in to follow users');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await followsApi.unfollow(post.author);
        setIsFollowing(false);
      } else {
        await followsApi.follow(post.author);
        setIsFollowing(true);
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      if (isSaved) {
        await savedPostsApi.unsavePost(post.id);
        setIsSaved(false);
        if (onSaveToggle) onSaveToggle(post.id, false);
      } else {
        await savedPostsApi.savePost(post.id);
        setIsSaved(true);
        if (onSaveToggle) onSaveToggle(post.id, true);
      }
    } catch (error: any) {
      console.error('Error toggling save:', error);
      // Handle 409 conflict (already saved) as success
      if (error.response?.status === 409) {
        setIsSaved(true);
        if (onSaveToggle) onSaveToggle(post.id, true);
      } else {
        alert('Failed to ' + (isSaved ? 'unsave' : 'save') + ' post. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="post-card">
      <VoteButtons
        voteCount={post.voteCount || 0}
        onUpvote={handleUpvote}
        onDownvote={handleDownvote}
        userVote={userVote}
      />
      <div className="post-content">
        <div className="post-meta">
          <Link to={`/c/${post.communitySlug || post.communityName.toLowerCase()}`} className="community-link">
            c/{post.communityName}
          </Link>
          <span className="separator">•</span>
          <span className="author">
            Posted by{' '}
            <Link to={`/u/${post.author}`} className="author-link">
              u/{post.author}
            </Link>
            {!isOwnPost && currentUser && (
              <button 
                className={`inline-follow-btn ${isFollowing ? 'following' : ''}`}
                onClick={handleFollowToggle}
                disabled={followLoading}
                title={isFollowing ? 'Unfollow' : 'Follow'}
              >
                {followLoading ? '...' : isFollowing ? '✓' : '+'}
              </button>
            )}
          </span>
          <span className="separator">•</span>
          <span className="time">{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        <Link to={`/p/${post.slug || post.id}`} className="post-title-link">
          <h2 className="post-title">
          {post.post_type === 'link' && '🔗 '}
          {post.post_type === 'poll' && '📊 '}
            {post.title}
          </h2>
        </Link>
        
        {/* Post Content based on type */}
        <PostContent post={post} isFullView={false} />
        
        {/* AI Summary Box - Only show if available */}
        {post.aiSummary && (
          <div className="ai-summary">
            <div className="ai-summary-header">
              <span className="ai-icon">✨</span>
              <span className="ai-label">AI Summary</span>
            </div>
            <div className="ai-summary-content">
              <AISummaryContent content={post.aiSummary} />
            </div>
          </div>
        )}

        <div className="post-actions">
          <Link to={`/p/${post.slug || post.id}`} className="action-button">
            💬 {post.commentCount} Comments
          </Link>
          <button className="action-button" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = `${window.location.origin}/p/${post.slug || post.id}`;
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
          }}>
            🔗 Share
          </button>
          <button 
            className={`action-button save-button ${isSaved ? 'saved' : ''}`}
            onClick={handleSaveToggle}
            disabled={isSaving}
            title={isSaved ? 'Unsave post' : 'Save post'}
          >
            {isSaving ? '⏳' : isSaved ? '🔖' : '📑'} {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostCard;
