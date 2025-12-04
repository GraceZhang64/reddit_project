import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PostFeed from '../components/PostFeed';
import CreatePostForm, { PostData } from '../components/CreatePostForm';
import PostSortFilter, { SortOption } from '../components/PostSortFilter';
import { Post, Community } from '../types';
import { communitiesApi, postsApi, votesApi } from '../services/api';
import './CommunityPage.css';

function CommunityPage() {
  const { slug } = useParams<{ slug: string }>();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('hot');
  const [isJoinLoading, setIsJoinLoading] = useState(false);

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
      // Update isJoined when slug changes
      const stored = localStorage.getItem('joinedCommunities');
      if (stored) {
        const joined = JSON.parse(stored);
        setIsJoined(joined.includes(slug));
      } else {
        setIsJoined(false);
      }
    }
  }, [slug]);

  const fetchAllCommunities = async () => {
    try {
      const response = await communitiesApi.getAll(1, 100);
      const apiCommunities = response.communities || [];
      const randFor = (seedStr: string | number, min = 120, max = 45000) => {
        const s = String(seedStr);
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
          hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
        }
        const r = hash / 0xffffffff;
        return Math.floor(min + r * (max - min + 1));
      };
      const mappedCommunities: Community[] = apiCommunities.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        memberCount: c.memberCount || c.member_count || c.users?.length || 0,
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
      
      const randFor = (seedStr: string | number, min = 120, max = 45000) => {
        const s = String(seedStr);
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
          hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
        }
        const r = hash / 0xffffffff;
        return Math.floor(min + r * (max - min + 1));
      };

      const mappedCommunity: Community = {
        id: communityData.id,
        name: communityData.name,
        slug: communityData.slug,
        description: communityData.description || '',
        memberCount: communityData.memberCount || communityData.memberCount || (communityData as any).users?.length || 0,
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
        post_type: p.post_type || p.postType || 'text',
        link_url: p.link_url || p.linkUrl || undefined,
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
          // Fetch user votes for each post
          const votes: Record<number, number> = {};
          await Promise.all(
            mappedPosts.map(async (p: any) => {
              try {
                const res = await votesApi.getUserVote('post', p.id);
                votes[p.id] = res.userVote ?? 0;
              } catch {
                votes[p.id] = 0;
              }
            })
          );
          setUserVotes(votes);
    } catch (err) {
      console.error('Error fetching community:', err);
      setError('Failed to load community. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  const handleJoinToggle = async () => {
    if (!slug || isJoinLoading) return;
    
    setIsJoinLoading(true);
    const previousIsJoined = isJoined;
    const previousMemberCount = memberCount;
    
    // Optimistic update
    setIsJoined(!isJoined);
    setMemberCount(isJoined ? memberCount - 1 : memberCount + 1);

    try {
      if (previousIsJoined) {
        // Leave community
        const result = await communitiesApi.leave(slug);
        setMemberCount(result.memberCount);
      } else {
        // Join community
        const result = await communitiesApi.join(slug);
        setMemberCount(result.memberCount);
      }
      
      // Update localStorage for backward compatibility
      const stored = localStorage.getItem('joinedCommunities');
      let joinedCommunities: string[] = stored ? JSON.parse(stored) : [];
      
      if (!previousIsJoined) {
        if (!joinedCommunities.includes(slug)) {
          joinedCommunities.push(slug);
        }
      } else {
        joinedCommunities = joinedCommunities.filter(id => id !== slug);
      }
      
      localStorage.setItem('joinedCommunities', JSON.stringify(joinedCommunities));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('joinedCommunitiesChanged'));
    } catch (err) {
      console.error('Error toggling membership:', err);
      // Revert optimistic update on error
      setIsJoined(previousIsJoined);
      setMemberCount(previousMemberCount);
    } finally {
      setIsJoinLoading(false);
    }
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
      // Use new backend vote endpoint
      const result = await votesApi.votePost(postId, newVote as 1 | -1 | 0);
      setUserVotes({ ...userVotes, [postId]: result.user_vote ?? 0 });
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, voteCount: result.vote_count } : p
        )
      );
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

  const handleCreatePost = async (postData: PostData) => {
    if (!community) return;
    
    try {
      await postsApi.create(postData);
      
      // Refresh posts
      await fetchCommunityData();
      setShowCreatePost(false);
    } catch (err: any) {
      console.error('Error creating post:', err);
      alert(err.response?.data?.error || 'Failed to create post. Please make sure you are logged in.');
    }
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
  };

  // Sort posts based on selected option
  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortOption) {
      case 'hot':
      case 'top':
        // Sort by vote count descending (most upvotes first)
        return (b.voteCount || 0) - (a.voteCount || 0);
      case 'new':
        // Sort by creation date descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        // Sort by creation date ascending (oldest first)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'controversial':
        // Sort by vote count ascending (most downvotes/lowest score first)
        return (a.voteCount || 0) - (b.voteCount || 0);
      default:
        return 0;
    }
  });

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
              <div className="community-stats">
                <span>{memberCount.toLocaleString()} members</span>
              </div>
            </div>
          </div>
          <button 
            className={`join-toggle-button ${isJoined ? 'joined' : 'not-joined'}`}
            onClick={handleJoinToggle}
            disabled={isJoinLoading}
          >
            {isJoinLoading ? '...' : isJoined ? '✓ Joined' : 'Join'}
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

          <PostSortFilter 
            currentSort={sortOption}
            onSortChange={handleSortChange}
            disabled={isLoading}
          />

          <PostFeed 
            posts={sortedPosts} 
            onVote={handleVote}
            userVotes={userVotes}
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
