import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PostFeed from '../components/PostFeed';
import CreatePostForm from '../components/CreatePostForm';
import { Post, Community } from '../types';
import './CommunityPage.css';

// Mock data
const mockCommunities: Community[] = [
  {
    id: 1,
    name: 'programming',
    description: 'A community for discussing programming and software development',
    memberCount: 15234,
    createdAt: '2025-01-15',
  },
  {
    id: 2,
    name: 'gaming',
    description: 'Share your gaming experiences and discuss video games',
    memberCount: 23456,
    createdAt: '2025-02-10',
  },
  {
    id: 3,
    name: 'cooking',
    description: 'Share recipes, cooking tips, and culinary adventures',
    memberCount: 8901,
    createdAt: '2025-03-05',
  },
];

const mockPosts: Post[] = [
  {
    id: 1,
    title: 'What is your favorite programming language?',
    body: 'I am curious to know what programming languages the community prefers and why. Share your thoughts!',
    author: 'john_doe',
    communityId: 1,
    communityName: 'programming',
    voteCount: 15,
    commentCount: 23,
    createdAt: '2025-10-20',
  },
  {
    id: 2,
    title: 'Tips for learning TypeScript',
    body: 'TypeScript has been gaining popularity. Here are some resources I found helpful for learning it...',
    author: 'jane_smith',
    communityId: 1,
    communityName: 'programming',
    voteCount: 23,
    commentCount: 12,
    createdAt: '2025-10-21',
  },
  {
    id: 3,
    title: 'Just finished Elden Ring!',
    body: 'What an incredible game. The boss fights were challenging but rewarding. Anyone else played it?',
    author: 'jane_smith',
    communityId: 2,
    communityName: 'gaming',
    voteCount: 42,
    commentCount: 34,
    createdAt: '2025-10-19',
  },
];

function CommunityPage() {
  const { id } = useParams<{ id: string }>();
  const communityId = parseInt(id || '1');
  
  const community = mockCommunities.find(c => c.id === communityId);
  const [posts, setPosts] = useState<Post[]>(
    mockPosts.filter(p => p.communityId === communityId)
  );
  const [isJoined, setIsJoined] = useState(false);
  const [memberCount, setMemberCount] = useState(community?.memberCount || 0);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});

  if (!community) {
    return (
      <div className="community-page">
        <div className="error-message">Community not found</div>
      </div>
    );
  }

  const handleJoinToggle = () => {
    setIsJoined(!isJoined);
    setMemberCount(isJoined ? memberCount - 1 : memberCount + 1);
  };

  const handleVote = (postId: number, value: number) => {
    const oldVote = userVotes[postId] || 0;
    const newVote = oldVote === value ? 0 : value;
    const voteDiff = newVote - oldVote;
    
    setUserVotes({ ...userVotes, [postId]: newVote });
    setPosts(
      posts.map((p) =>
        p.id === postId ? { ...p, voteCount: p.voteCount + voteDiff } : p
      )
    );
  };

  const handleCreatePost = (title: string, body: string) => {
    const newPost: Post = {
      id: posts.length + 100,
      title,
      body,
      author: 'current_user',
      communityId: community.id,
      communityName: community.name,
      voteCount: 1,
      commentCount: 0,
      createdAt: new Date().toISOString(),
    };
    setPosts([newPost, ...posts]);
    setShowCreatePost(false);
  };

  return (
    <div className="community-page">
      <div className="community-header">
        <div className="community-header-content">
          <div className="community-info">
            <div className="community-icon">
              {community.name.charAt(0).toUpperCase()}
            </div>
            <div className="community-details">
              <h1>r/{community.name}</h1>
              <p>{community.description}</p>
              <div className="community-stats">
                <span>{memberCount.toLocaleString()} members</span>
              </div>
            </div>
          </div>
          <button 
            className={`join-toggle-button ${isJoined ? 'joined' : 'not-joined'}`}
            onClick={handleJoinToggle}
          >
            {isJoined ? '✓ Joined' : 'Join'}
          </button>
        </div>
      </div>

      <div className="community-content">
        <div className="posts-section">
          <div className="posts-header">
            <h2>Posts</h2>
            <button 
              className="create-post-button"
              onClick={() => setShowCreatePost(!showCreatePost)}
            >
              {showCreatePost ? '✕ Cancel' : '+ Create Post'}
            </button>
          </div>

          {showCreatePost && (
            <div style={{ marginBottom: '1.5rem' }}>
              <CreatePostForm
                communities={mockCommunities}
                onSubmit={handleCreatePost}
                onCancel={() => setShowCreatePost(false)}
                defaultCommunityId={community.id}
              />
            </div>
          )}

          <PostFeed 
            posts={posts} 
            onVote={handleVote}
          />
        </div>

        <div className="sidebar">
          <div className="sidebar-card">
            <h3>About Community</h3>
            <p>{community.description}</p>
            <div className="sidebar-stats">
              <div className="stat">
                <strong>{memberCount.toLocaleString()}</strong>
                <span>Members</span>
              </div>
              <div className="stat">
                <strong>{posts.length}</strong>
                <span>Posts</span>
              </div>
            </div>
            <button 
              className="create-post-button-full"
              onClick={() => setShowCreatePost(true)}
            >
              Create Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunityPage;
