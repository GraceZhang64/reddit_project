import './VoteButtons.css';

interface VoteButtonsProps {
  voteCount: number;
  onUpvote: () => void;
  onDownvote: () => void;
  userVote?: number; // -1, 0, or 1
}

function VoteButtons({ voteCount, onUpvote, onDownvote, userVote = 0 }: VoteButtonsProps) {
  return (
    <div className="vote-buttons">
      <button 
        className={`vote-btn upvote ${userVote === 1 ? 'active' : ''}`}
        onClick={onUpvote}
        aria-label="Upvote"
      >
        ▲
      </button>
      <span className={`vote-count ${userVote === 1 ? 'upvoted' : userVote === -1 ? 'downvoted' : ''}`}>
        {voteCount}
      </span>
      <button 
        className={`vote-btn downvote ${userVote === -1 ? 'active' : ''}`}
        onClick={onDownvote}
        aria-label="Downvote"
      >
        ▼
      </button>
    </div>
  );
}

export default VoteButtons;
