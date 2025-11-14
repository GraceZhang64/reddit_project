import './VoteButtons.css';


interface VoteButtonsProps {
  voteCount: number;
  onVote?: (value: number) => void;
  onUpvote?: () => void;
  onDownvote?: () => void;
  userVote?: number; // -1, 0, or 1
  size?: 'small' | 'normal';
}

function VoteButtons({ voteCount, onVote, onUpvote, onDownvote, userVote = 0, size = 'normal' }: VoteButtonsProps) {
  const handleUpvote = () => {
    if (onVote) {
      onVote(1);
    } else if (onUpvote) {
      onUpvote();
    }
  };

  const handleDownvote = () => {
    if (onVote) {
      onVote(-1);
    } else if (onDownvote) {
      onDownvote();
    }
  };

  return (
    <div className={`vote-buttons ${size === 'small' ? 'vote-buttons-small' : ''}`}>
      <button
        className={`vote-btn upvote ${userVote === 1 ? 'active' : ''}`}
        onClick={handleUpvote}
        aria-label="Upvote"
      >
        
      </button>
      <span className={`vote-count ${userVote === 1 ? 'upvoted' : userVote === -1 ? 'downvoted' : ''}`}>
        {voteCount}
      </span>
      <button
        className={`vote-btn downvote ${userVote === -1 ? 'active' : ''}`}
        onClick={handleDownvote}
        aria-label="Downvote"
      >
        
      </button>
    </div>
  );
}

export default VoteButtons;
