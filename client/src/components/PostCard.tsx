import { Link } from 'react-router-dom';
import { Post } from '../types';
import VoteButtons from './VoteButtons';
import PostContent from './PostContent';
import './PostCard.css';
import AISummaryContent from './AISummaryContent';

interface PostCardProps {
  post: Post;
  onVote?: (postId: number, value: number) => void;
  userVote?: number;
}

function PostCard({ post, onVote, userVote = 0 }: PostCardProps) {
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

  return (
    <div className="post-card">
      <VoteButtons
        voteCount={post.voteCount}
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
          </span>
          <span className="separator">•</span>
          <span className="time">{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        <Link to={`/p/${post.slug || post.id}`} className="post-title-link">
          <h2 className="post-title">
            {post.post_type === 'link' && '🔗 '}
            {post.post_type === 'image' && '🖼️ '}
            {post.post_type === 'video' && '🎥 '}
            {post.post_type === 'poll' && '📊 '}
            {post.post_type === 'crosspost' && '🔄 '}
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
        </div>
      </div>
    </div>
  );
}

export default PostCard;
