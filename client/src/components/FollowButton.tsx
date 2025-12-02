import React, { useState, useEffect } from 'react';
import { followsApi } from '../services/api';
import './FollowButton.css';

interface FollowButtonProps {
  username: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

function FollowButton({ username, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkFollowStatus();
  }, [username]);

  const checkFollowStatus = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const result = await followsApi.checkFollowing(username);
      setIsFollowing(result.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('Please log in to follow users');
      return;
    }

    setProcessing(true);
    try {
      if (isFollowing) {
        await followsApi.unfollow(username);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await followsApi.follow(username);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      alert(error.response?.data?.error || 'Failed to update follow status');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <button className="follow-button follow-loading" disabled>
        Loading...
      </button>
    );
  }

  const token = localStorage.getItem('access_token');
  if (!token) {
    return null; // Don't show button if not logged in
  }

  return (
    <button
      className={`follow-button ${isFollowing ? 'following' : 'not-following'}`}
      onClick={handleFollowToggle}
      disabled={processing}
    >
      {processing ? '...' : isFollowing ? '✓ Following' : '+ Follow'}
    </button>
  );
}

export default FollowButton;

