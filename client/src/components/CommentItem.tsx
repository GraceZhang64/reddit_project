import { useState } from 'react';
import { Comment } from '../types';
import VoteButtons from './VoteButtons';
import { votesApi } from '../services/api';
import './CommentItem.css';

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  maxDepth?: number;
  onReply?: (parentId: number, body: string) => void;
}

function CommentItem({ comment, depth = 0, maxDepth = 3, onReply }: CommentItemProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [userVote, setUserVote] = useState(comment.voteCount || 0);
  const [voteCount, setVoteCount] = useState(comment.voteCount || 0);

  const hasReplies = comment.replies && comment.replies.length > 0;
  const shouldShowContinueThread = depth >= maxDepth && hasReplies;
  const canShowReplies = depth < maxDepth && hasReplies;

  const handleVote = async (value: number) => {
    const oldVote = userVote;
    const newVote = oldVote === value ? 0 : value;
    const voteDiff = newVote - oldVote;
    
    // Optimistic update
    setUserVote(newVote);
    setVoteCount(voteCount + voteDiff);

    try {
      if (newVote === 0) {
        await votesApi.remove('comment', comment.id);
      } else {
        await votesApi.cast({
          target_type: 'comment',
          target_id: comment.id,
          value: newVote as 1 | -1,
        });
      }
    } catch (err: any) {
      console.error('Error voting on comment:', err);
      // Revert on error
      setUserVote(oldVote);
      setVoteCount(voteCount - voteDiff);
      alert(err.response?.data?.error || 'Failed to vote. Please make sure you are logged in.');
    }
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !onReply) return;

    onReply(comment.id, replyBody.trim());
    setReplyBody('');
    setIsReplying(false);
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`comment-item ${isCollapsed ? 'collapsed' : ''}`} data-depth={depth}>
      <div className="comment-border-line" />
      
      <div className="comment-content">
        <div className="comment-header">
          <button 
            className="collapse-button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand comment" : "Collapse comment"}
          >
            [{isCollapsed ? '+' : '−'}]
          </button>
          <span className="comment-author">{comment.author}</span>
          <span className="comment-meta">• {formatTimestamp(comment.createdAt)}</span>
          {isCollapsed && hasReplies && (
            <span className="collapsed-info">({comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'})</span>
          )}
        </div>

        {!isCollapsed && (
          <>
            <div className="comment-body">{comment.body}</div>

            <div className="comment-actions">
              <VoteButtons
                voteCount={voteCount}
                userVote={userVote}
                onVote={handleVote}
                size="small"
              />
              <button 
                className="comment-action-btn"
                onClick={() => setIsReplying(!isReplying)}
              >
                Reply
              </button>
              <button className="comment-action-btn">Share</button>
              <button className="comment-action-btn">Report</button>
            </div>

            {isReplying && (
              <form className="reply-form" onSubmit={handleReplySubmit}>
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="What are your thoughts?"
                  rows={3}
                  autoFocus
                />
                <div className="reply-actions">
                  <button type="submit" disabled={!replyBody.trim()}>
                    Comment
                  </button>
                  <button type="button" onClick={() => setIsReplying(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Show nested replies or "Continue thread" link */}
            {canShowReplies && (
              <div className="comment-replies">
                {comment.replies!.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    depth={depth + 1}
                    maxDepth={maxDepth}
                    onReply={onReply}
                  />
                ))}
              </div>
            )}

            {shouldShowContinueThread && (
              <div className="continue-thread">
                <button 
                  className="continue-thread-btn"
                  onClick={() => {/* TODO: Navigate to comment permalink page */}}
                >
                  → Continue this thread ({comment.replies!.length} more {comment.replies!.length === 1 ? 'reply' : 'replies'})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CommentItem;

