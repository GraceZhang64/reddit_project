import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersApi, followsApi, Community } from '../services/api';
import FollowButton from '../components/FollowButton';
import './UserProfilePage.css';

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  karma: number;
  createdAt: string;
}

function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = localStorage.getItem('username');
  const isOwnProfile = currentUser === username;

  useEffect(() => {
    if (username) {
      fetchUserProfile();
      fetchFollowCounts();
      fetchUserCommunities();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      const data = await usersApi.getProfile(username!);
      console.log('Profile data received:', data);
      
      // Ensure we have the required fields
      if (data && data.username) {
        setProfile({
          id: data.id,
          username: data.username,
          avatar_url: data.avatar_url,
          bio: data.bio,
          karma: data.karma || 0,
          createdAt: data.createdAt,
        });
      } else {
        setError('Invalid profile data received');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load user profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const [followersData, followingData] = await Promise.all([
        followsApi.getFollowers(username!, 1, 1),
        followsApi.getFollowing(username!, 1, 1),
      ]);
      setFollowerCount(followersData.pagination.total);
      setFollowingCount(followingData.pagination.total);
    } catch (err) {
      console.error('Error fetching follow counts:', err);
    }
  };

  const fetchUserCommunities = async () => {
    try {
      const data = await usersApi.getCommunities(username!);
      setCommunities(data.communities || []);
    } catch (err) {
      console.error('Error fetching communities:', err);
    }
  };

  const handleFollowChange = (isFollowing: boolean) => {
    setFollowerCount((prev) => (isFollowing ? prev + 1 : prev - 1));
  };

  if (loading) {
    return (
      <div className="user-profile-page">
        <div className="profile-container">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="user-profile-page">
        <div className="profile-container">
          <p style={{ color: '#c33' }}>{error || 'User not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} />
            ) : (
              <div className="avatar-placeholder">
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-info">
            <div className="profile-title-row">
              <h1>u/{profile.username}</h1>
              {!isOwnProfile && <FollowButton username={profile.username} onFollowChange={handleFollowChange} />}
            </div>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-stats">
              <div className="stat">
                <strong>{profile.karma.toLocaleString()}</strong>
                <span>Karma</span>
              </div>
              <div className="stat">
                <strong>{followerCount.toLocaleString()}</strong>
                <span>Followers</span>
              </div>
              <div className="stat">
                <strong>{followingCount.toLocaleString()}</strong>
                <span>Following</span>
              </div>
              <div className="stat">
                <strong>{new Date(profile.createdAt).toLocaleDateString()}</strong>
                <span>Joined</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2 className="section-title">Communities</h2>
          {communities.length > 0 ? (
            <div className="communities-grid">
              {communities.map((community) => (
                <Link 
                  key={community.id} 
                  to={`/c/${community.slug}`}
                  className="community-card"
                >
                  <div className="community-card-header">
                    <span className="community-icon">🏘️</span>
                    <h3>c/{community.name}</h3>
                  </div>
                  {community.description && (
                    <p className="community-description">{community.description}</p>
                  )}
                  <div className="community-meta">
                    <span>👥 {community.memberCount || 0} members</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--blueit-text-secondary)' }}>
              No communities created yet
            </p>
          )}
        </div>

        <div className="profile-tabs">
          <button className="profile-tab active">Posts</button>
          <button className="profile-tab">Comments</button>
        </div>

        <div className="profile-content">
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--blueit-text-secondary)' }}>
            Post and comment history coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;

