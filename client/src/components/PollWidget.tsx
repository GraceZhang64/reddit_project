import { useState, useEffect } from 'react';
import { Poll } from '../types';
import axios from 'axios';
import './PollWidget.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

interface PollWidgetProps {
  postId: number;
}

function PollWidget({ postId }: PollWidgetProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    fetchPoll();
  }, [postId]);

  const fetchPoll = async () => {
    try {
      const response = await axios.get(`${API_BASE}/polls/post/${postId}`);
      setPoll(response.data);

      // Fetch user's vote if authenticated
      const token = localStorage.getItem('token');
      if (token && response.data.id) {
        try {
          const voteResponse = await axios.get(
            `${API_BASE}/polls/${response.data.id}/user-vote`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setSelectedOption(voteResponse.data.voted_option_id);
        } catch (err) {
          // User hasn't voted yet or not authenticated
        }
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionId: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to vote');
      return;
    }

    setVoting(true);
    try {
      await axios.post(
        `${API_BASE}/polls/vote`,
        { option_id: optionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      if (selectedOption === optionId) {
        setSelectedOption(null);
      } else {
        setSelectedOption(optionId);
      }

      // Refresh poll data
      await fetchPoll();
    } catch (error: any) {
      console.error('Error voting:', error);
      alert(error.response?.data?.error || 'Failed to vote');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return <div className="poll-widget loading">Loading poll...</div>;
  }

  if (!poll) {
    return null;
  }

  const hasVoted = selectedOption !== null;
  const isExpired = poll.is_expired;
  const showResults = hasVoted || isExpired;

  return (
    <div className="poll-widget">
      <div className="poll-header">
        <span className="poll-icon">📊</span>
        <span className="poll-label">Poll</span>
        {isExpired && <span className="poll-expired">Ended</span>}
        {poll.expires_at && !isExpired && (
          <span className="poll-expires">
            Ends {new Date(poll.expires_at).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="poll-options">
        {poll.options.map((option) => {
          const percentage =
            poll.total_votes > 0
              ? Math.round((option.vote_count / poll.total_votes) * 100)
              : 0;
          const isSelected = selectedOption === option.id;

          return (
            <div key={option.id} className="poll-option-container">
              {showResults ? (
                <div className={`poll-result ${isSelected ? 'selected' : ''}`}>
                  <div className="result-bar" style={{ width: `${percentage}%` }} />
                  <div className="result-content">
                    <span className="result-text">{option.text}</span>
                    <span className="result-stats">
                      {isSelected && <span className="selected-marker">✓</span>}
                      {percentage}% ({option.vote_count} {option.vote_count === 1 ? 'vote' : 'votes'})
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  className="poll-option-button"
                  onClick={() => handleVote(option.id)}
                  disabled={voting || isExpired}
                >
                  <span className="option-radio" />
                  <span className="option-text">{option.text}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="poll-footer">
        <span className="poll-total">
          {poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}
        </span>
        {hasVoted && !isExpired && (
          <button
            className="poll-change-vote"
            onClick={() => handleVote(selectedOption!)}
            disabled={voting}
          >
            Change vote
          </button>
        )}
      </div>
    </div>
  );
}

export default PollWidget;

