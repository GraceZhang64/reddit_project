import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import PostCard from '../components/PostCard';
import { Post } from '../types';
import { postsApi, commentsApi, votesApi } from '../services/api';
import './SearchPage.css';

type SearchType = 'posts' | 'comments' | 'all';

interface SearchComment {
  id: number;
  body: string;
  authorId: string;
  postId: number;
  vote_count: number;
  user_vote: number | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
  post: {
    id: number;
    slug?: string;
    title: string;
    community: {
      id: number;
      name: string;
      slug: string;
    };
  };
}

function SearchPage() {
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<SearchComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});

  // Map API post to component Post type
  const mapApiPost = (apiPost: any): Post => ({
    id: apiPost.id,
    slug: apiPost.slug || undefined,
    title: apiPost.title,
    body: apiPost.body || undefined,
    post_type: apiPost.post_type || apiPost.postType || 'text',
    link_url: apiPost.link_url || apiPost.linkUrl || undefined,
    author: apiPost.author?.username || 'Unknown',
    communityId: apiPost.community?.id || 0,
    communityName: apiPost.community?.name || 'Unknown',
    communitySlug: apiPost.community?.slug,
    voteCount: apiPost.voteCount || apiPost.vote_count || 0,
    commentCount: apiPost.commentCount || apiPost.comment_count || 0,
    createdAt: apiPost.createdAt || apiPost.created_at,
    aiSummary: apiPost.ai_summary || undefined,
  });

  useEffect(() => {
    if (!searchQuery.trim()) {
      setPosts([]);
      setComments([]);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (searchType === 'posts' || searchType === 'all') {
          const postsResponse = await postsApi.search(searchQuery, 1, 50);
          const fetchedPosts = postsResponse.posts || [];
          setPosts(fetchedPosts.map(mapApiPost));
        } else {
          setPosts([]);
        }

        if (searchType === 'comments' || searchType === 'all') {
          const commentsResponse = await commentsApi.search(searchQuery, 1, 50);
          const fetchedComments = (commentsResponse.comments || []).map((c: any) => ({
            ...c,
            user_vote: c.user_vote || null
          }));
          setComments(fetchedComments);
        } else {
          setComments([]);
        }
      } catch (err) {
        console.error('Error performing search:', err);
        setError('Search failed. Please try again.');
        setPosts([]);
        setComments([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [searchQuery, searchType]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
      if (newVote === 0) {
        await votesApi.remove('post', postId);
      } else {
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

  const handleCommentVote = async (commentId: number, currentVote: number, value: number) => {
    const oldVote = currentVote;
    const newVote = oldVote === value ? 0 : value;
    const voteDiff = newVote - oldVote;
    
    // Optimistic update
    setComments(
      comments.map((c) =>
        c.id === commentId ? { ...c, vote_count: c.vote_count + voteDiff, user_vote: newVote } : c
      )
    );

    try {
      if (newVote === 0) {
        await votesApi.remove('comment', commentId);
      } else {
        await votesApi.cast({
          target_type: 'comment',
          target_id: commentId,
          value: newVote as 1 | -1,
        });
      }
    } catch (err: any) {
      console.error('Error voting:', err);
      // Revert on error
      setComments(
        comments.map((c) =>
          c.id === commentId ? { ...c, vote_count: c.vote_count - voteDiff, user_vote: oldVote } : c
        )
      );
      alert(err.response?.data?.error || 'Failed to vote. Please make sure you are logged in.');
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} className="search-highlight">{part}</mark> : part
    );
  };

  const totalResults = posts.length + comments.length;

  return (
    <div className="search-page">
      <div className="search-container">
        <div className="search-header">
          <h1>Search BlueIt</h1>
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search for posts, comments, communities..."
            showResultCount={false}
          />
        </div>

        <div className="search-filters">
          <button
            className={`filter-tab ${searchType === 'all' ? 'active' : ''}`}
            onClick={() => setSearchType('all')}
          >
            All ({totalResults})
          </button>
          <button
            className={`filter-tab ${searchType === 'posts' ? 'active' : ''}`}
            onClick={() => setSearchType('posts')}
          >
            Posts ({posts.length})
          </button>
          <button
            className={`filter-tab ${searchType === 'comments' ? 'active' : ''}`}
            onClick={() => setSearchType('comments')}
          >
            Comments ({comments.length})
          </button>
        </div>

        {isLoading ? (
          <div className="search-loading">
            <p>Searching...</p>
          </div>
        ) : error ? (
          <div className="search-error">
            <p>{error}</p>
          </div>
        ) : !searchQuery.trim() ? (
          <div className="search-empty">
            <p>Enter a search query to find posts and comments</p>
          </div>
        ) : totalResults === 0 ? (
          <div className="search-no-results">
            <p>No results found for "{searchQuery}"</p>
            <p className="search-hint">Try different keywords or check your spelling</p>
          </div>
        ) : (
          <div className="search-results">
            {(searchType === 'posts' || searchType === 'all') && posts.length > 0 && (
              <div className="results-section">
                <h2 className="results-heading">Posts ({posts.length})</h2>
                <div className="posts-results">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onVote={handleVote}
                      userVote={userVotes[post.id] || 0}
                    />
                  ))}
                </div>
              </div>
            )}

            {(searchType === 'comments' || searchType === 'all') && comments.length > 0 && (
              <div className="results-section">
                <h2 className="results-heading">Comments ({comments.length})</h2>
                <div className="comments-results">
                  {comments.map((comment) => (
                    <div key={comment.id} className="comment-result">
                      <div className="comment-vote-section">
                        <button
                          className={`vote-btn upvote ${comment.user_vote === 1 ? 'active' : ''}`}
                          onClick={() => handleCommentVote(comment.id, comment.user_vote || 0, 1)}
                        >
                          ▲
                        </button>
                        <span className="vote-count">{comment.vote_count}</span>
                        <button
                          className={`vote-btn downvote ${comment.user_vote === -1 ? 'active' : ''}`}
                          onClick={() => handleCommentVote(comment.id, comment.user_vote || 0, -1)}
                        >
                          ▼
                        </button>
                      </div>
                      <div className="comment-content-section">
                        <div className="comment-meta">
                          <Link to={`/c/${comment.post.community.slug}`} className="community-link">
                            c/{comment.post.community.name}
                          </Link>
                          <span className="separator">•</span>
                          <span className="author">u/{comment.author.username}</span>
                          <span className="separator">•</span>
                          <span className="time">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="comment-post-link">
                          <Link to={`/p/${comment.post.slug || comment.post.id}`}>
                            on: {comment.post.title}
                          </Link>
                        </div>
                        <p className="comment-body">
                          {highlightMatch(comment.body, searchQuery)}
                        </p>
                        <Link
                          to={`/p/${comment.post.slug || comment.post.id}`}
                          className="view-context-link"
                        >
                          View in context →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
