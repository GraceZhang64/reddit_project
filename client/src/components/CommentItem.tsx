import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Comment } from '../types';
import VoteButtons from './VoteButtons';
import { votesApi, commentsApi } from '../services/api';
import { formatMentions } from '../utils/formatMentions';
import './CommentItem.css';

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  maxDepth?: number;
  onReply?: (parentId: number, body: string) => void;
  onDelete?: (commentId: number) => void;
  disabled?: boolean;
}

function CommentItem({ comment, depth = 0, maxDepth = 3, onReply, onDelete, disabled = false }: CommentItemProps) {
  const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [userVote, setUserVote] = useState(comment.voteCount || 0);
  const [voteCount, setVoteCount] = useState(comment.voteCount || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [displayBody, setDisplayBody] = useState(comment.body);
  const [isEditSaving, setIsEditSaving] = useState(false);

  const commentAuthor = typeof comment.author === 'string' 
    ? comment.author 
    : (comment.author as any)?.username || 'Unknown';
  const isOwnComment = currentUser && currentUser === commentAuthor;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    setIsDeleting(true);
    try {
      await commentsApi.delete(comment.id);
      setIsDeleted(true);
      if (onDelete) {
        onDelete(comment.id);
      }
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      alert(err.response?.data?.error || 'Failed to delete comment');
      setIsDeleting(false);
    }
  };

  const handleEditSave = async () => {
    if (!editBody.trim()) return;
    
    setIsEditSaving(true);
    try {
      await commentsApi.update(comment.id, editBody.trim());
      setDisplayBody(editBody.trim());
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating comment:', err);
      alert(err.response?.data?.error || 'Failed to update comment');
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditBody(displayBody);
    setIsEditing(false);
  };

  // Don't render if deleted
  if (isDeleted) {
    return null;
  }

  const hasReplies = comment.replies && comment.replies.length > 0;
  const shouldShowContinueThread = depth >= maxDepth && hasReplies;
  const canShowReplies = depth < maxDepth && hasReplies;

  const handleVote = async (value: number) => {
    if (disabled) return;
    const oldVote = userVote;
    const newVote = oldVote === value ? 0 : value;
    const voteDiff = newVote - oldVote;
    
    // Optimistic update
    setUserVote(newVote);
    setVoteCount(voteCount + voteDiff);

    try {
      const result = await votesApi.voteComment(comment.id, newVote as 1 | -1 | 0);
      // Update with server response
      setUserVote(result.user_vote ?? 0);
      setVoteCount(result.voteCount);
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
          <Link 
            to={`/u/${typeof comment.author === 'string' ? comment.author : (comment.author as any)?.username || 'Unknown'}`}
            className="comment-author-link"
          >
            {typeof comment.author === 'string' 
              ? comment.author 
              : (comment.author as any)?.username || 'Unknown'}
          </Link>
          <span className="comment-meta">• {formatTimestamp(comment.createdAt)}</span>
          {isCollapsed && hasReplies && (
            <span className="collapsed-info">({comment.replies!.length} {comment.replies!.length === 1 ? 'reply' : 'replies'})</span>
          )}
        </div>

        {!isCollapsed && (
          <>
            {isEditing ? (
              <div className="comment-edit-form">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={3}
                  autoFocus
                />
                <div className="comment-edit-actions">
                  <button 
                    className="comment-edit-save"
                    onClick={handleEditSave}
                    disabled={isEditSaving || !editBody.trim()}
                  >
                    {isEditSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    className="comment-edit-cancel"
                    onClick={handleEditCancel}
                    disabled={isEditSaving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="comment-body">
                {formatMentions(displayBody).map((part, idx) => (
                  <span key={idx}>{part}</span>
                ))}
              </div>
            )}

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
              {isOwnComment && !isEditing && (
                <>
                  <button 
                    className="comment-action-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </button>
                  <button 
                    className="comment-action-btn comment-delete-btn"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              )}
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
                    onDelete={onDelete}
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

