import React from 'react';
import './VoteButtons.css';


interface VoteButtonsProps {
  voteCount: number;
  onVote?: (value: number) => void;
  onUpvote?: () => void;
  onDownvote?: () => void;
  userVote?: number; // -1, 0, or 1
  size?: 'small' | 'normal';
  disabled?: boolean;
}

function VoteButtons({ voteCount, onVote, onUpvote, onDownvote, userVote = 0, size = 'normal', disabled = false }: VoteButtonsProps) {
  const handleUpvote = () => {
    if (disabled) return;
    if (onVote) {
      onVote(1);
    } else if (onUpvote) {
      onUpvote();
    }
  };

  const handleDownvote = () => {
    if (disabled) return;
    if (onVote) {
      onVote(-1);
    } else if (onDownvote) {
      onDownvote();
    }
  };

  return (
    <div className={`vote-buttons ${size === 'small' ? 'vote-buttons-small' : ''} ${disabled ? 'disabled' : ''}`}>
      <button
        className={`vote-btn upvote ${userVote === 1 ? 'active' : ''}`}
        onClick={handleUpvote}
        disabled={disabled}
        aria-label="Upvote"
        title={disabled ? "Log in to vote" : "Upvote"}
      >
        ▲
      </button>
      <span className={`vote-count ${userVote === 1 ? 'upvoted' : userVote === -1 ? 'downvoted' : ''}`}>
        {voteCount}
      </span>
      <button
        className={`vote-btn downvote ${userVote === -1 ? 'active' : ''}`}
        onClick={handleDownvote}
        disabled={disabled}
        aria-label="Downvote"
        title={disabled ? "Log in to vote" : "Downvote"}
      >
        ▼
      </button>
    </div>
  );
}

export default VoteButtons;
