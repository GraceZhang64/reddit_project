import { Link } from 'react-router-dom';
import { Post } from '../types';
import VoteButtons from './VoteButtons';
import './PostCard.css';

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
          <span className="author">Posted by u/{post.author}</span>
          <span className="separator">•</span>
          <span className="time">{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        <Link to={`/p/${post.slug || post.id}`} className="post-title-link">
          <h2 className="post-title">{post.title}</h2>
        </Link>
        {post.body && <p className="post-body">{post.body}</p>}
        
        {/* AI Summary Box - Only show if available */}
        {post.aiSummary && (
          <div className="ai-summary">
            <div className="ai-summary-header">
              <span className="ai-icon">✨</span>
              <span className="ai-label">AI Summary</span>
            </div>
            <p className="ai-summary-text">
              {post.aiSummary}
            </p>
          </div>
        )}

        <div className="post-actions">
          <Link to={`/p/${post.slug || post.id}`} className="action-button">
            💬 {post.commentCount} Comments
          </Link>
          <button className="action-button">🔗 Share</button>
          <button className="action-button">💾 Save</button>
        </div>
      </div>
    </div>
  );
}

export default PostCard;
