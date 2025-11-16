import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PostFeed from '../components/PostFeed';
import CreatePostForm from '../components/CreatePostForm';
import SearchBar from '../components/SearchBar';
import { Post, Community } from '../types';
import { communitiesApi, postsApi } from '../services/api';
import './CommunityPage.css';

function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberCount, setMemberCount] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);

  // Initialize isJoined from localStorage
  const [isJoined, setIsJoined] = useState(() => {
    if (!slug) return false;
    const stored = localStorage.getItem('joinedCommunities');
    if (stored) {
      const joined = JSON.parse(stored);
      return joined.includes(slug);
    }
    return false;
  });

  useEffect(() => {
    if (slug) {
      fetchCommunityData();
      fetchAllCommunities();
    }
  }, [slug]);

  const fetchAllCommunities = async () => {
    try {
      const response = await communitiesApi.getAll(1, 100);
      const apiCommunities = response.communities || [];
      const mappedCommunities: Community[] = apiCommunities.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        memberCount: c.users?.length || 0,
        createdAt: c.createdAt || c.created_at,
      }));
      setCommunities(mappedCommunities);
    } catch (err) {
      console.error('Error fetching communities:', err);
    }
  };

  const fetchCommunityData = async () => {
    if (!slug) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch community details
      const communityData = await communitiesApi.getBySlug(slug);
      
      const mappedCommunity: Community = {
        id: communityData.id,
        name: communityData.name,
        slug: communityData.slug,
        description: communityData.description || '',
        memberCount: (communityData as any).users?.length || 0,
        createdAt: communityData.createdAt || (communityData as any).created_at,
      };
      
      setCommunity(mappedCommunity);
      setMemberCount(mappedCommunity.memberCount);
      
      // Fetch community posts
      const postsResponse = await communitiesApi.getPosts(slug, 1, 50);
      const apiPosts = postsResponse.posts || [];
      
      const mappedPosts: Post[] = apiPosts.map((p: any) => ({
        id: p.id,
        slug: p.slug || undefined,
        title: p.title,
        body: p.body || undefined,
        author: p.author?.username || 'Unknown',
        communityId: p.community?.id || 0,
        communityName: p.community?.name || 'Unknown',
        communitySlug: p.community?.slug,
        voteCount: p.voteCount || p.vote_count || 0,
        commentCount: p.commentCount || p.comment_count || 0,
        createdAt: p.createdAt || p.created_at,
        aiSummary: p.ai_summary || undefined,
      }));
      
      setPosts(mappedPosts);
      setFilteredPosts(mappedPosts);
    } catch (err) {
      console.error('Error fetching community:', err);
      setError('Failed to load community. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyword search filter for posts
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPosts(posts);
    } else {
      const query = searchQuery.toLowerCase();
      // Split search query into keywords
      const keywords = query.split(/\s+/).filter(k => k.length > 0);
      
      const filtered = posts.filter((post) => {
        const titleLower = post.title.toLowerCase();
        const bodyLower = (post.body || '').toLowerCase();
        const authorLower = post.author.toLowerCase();
        const searchText = `${titleLower} ${bodyLower} ${authorLower}`;
        
        // Match if ANY keyword is found
        return keywords.some(keyword => searchText.includes(keyword));
      });
      setFilteredPosts(filtered);
    }
  }, [searchQuery, posts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (isLoading) {
    return (
      <div className="community-page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading community...</p>
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="community-page">
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--blueit-error)' }}>
          <p>{error || 'Community not found'}</p>
          <button onClick={fetchCommunityData} style={{ marginTop: '1rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleJoinToggle = () => {
    if (!slug) return;
    
    const newIsJoined = !isJoined;
    setIsJoined(newIsJoined);
    setMemberCount(newIsJoined ? memberCount + 1 : memberCount - 1);

    // Update localStorage
    const stored = localStorage.getItem('joinedCommunities');
    let joinedCommunities: string[] = stored ? JSON.parse(stored) : [];
    
    if (newIsJoined) {
      // Add community
      if (!joinedCommunities.includes(slug)) {
        joinedCommunities.push(slug);
      }
    } else {
      // Remove community
      joinedCommunities = joinedCommunities.filter(id => id !== slug);
    }
    
    localStorage.setItem('joinedCommunities', JSON.stringify(joinedCommunities));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('joinedCommunitiesChanged'));
  };

  const handleVote = async (postId: number, value: number) => {
    const oldVote = userVotes[postId] || 0;
    const newVote = oldVote === value ? 0 : value;
    const voteDiff = newVote - oldVote;
    
    // Optimistic update
    setUserVotes({ ...userVotes, [postId]: newVote });
    setPosts(
      posts.map((p) =>
        p.id === postId ? { ...p, voteCount: (p.voteCount || 0) + voteDiff } : p
      )
    );

    try {
      const { votesApi } = await import('../services/api');
      
      if (newVote === 0) {
        // Remove vote
        await votesApi.remove('post', postId);
      } else {
        // Cast vote
        await votesApi.cast({
          target_type: 'post',
          target_id: postId,
          value: newVote as 1 | -1,
        });
      }
    } catch (err: any) {
      console.error('Error voting:', err);
      // Revert on error
      setUserVotes({ ...userVotes, [postId]: oldVote });
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, voteCount: (p.voteCount || 0) - voteDiff } : p
        )
      );
      alert(err.response?.data?.error || 'Failed to vote. Please make sure you are logged in.');
    }
  };

  const handleCreatePost = async (title: string, body: string) => {
    if (!community) return;
    
    try {
      await postsApi.create({
        title,
        body,
        community_id: community.id,
      });
      
      // Refresh posts
      await fetchCommunityData();
      setShowCreatePost(false);
    } catch (err: any) {
      console.error('Error creating post:', err);
      alert(err.response?.data?.error || 'Failed to create post. Please make sure you are logged in.');
    }
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
                communities={communities}
                onSubmit={handleCreatePost}
                onCancel={() => setShowCreatePost(false)}
                defaultCommunityId={community.id}
              />
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search posts by keywords, title, content, or author..."
              showResultCount={searchQuery.length > 0}
              resultCount={filteredPosts.length}
            />
          </div>

          {filteredPosts.length === 0 && searchQuery ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--blueit-text-secondary)' }}>
              <p>No posts found matching "{searchQuery}"</p>
              <button onClick={() => setSearchQuery('')} style={{ marginTop: '1rem' }}>
                Clear search
              </button>
            </div>
          ) : (
            <PostFeed 
              posts={filteredPosts} 
              onVote={handleVote}
            />
          )}
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
