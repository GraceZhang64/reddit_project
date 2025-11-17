import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VoteButtons from '../components/VoteButtons';
import CommentItem from '../components/CommentItem';
import PostContent from '../components/PostContent';
import PollWidget from '../components/PollWidget';
import { Post, Comment } from '../types';
import { commentsApi, postsApi } from '../services/api';
import './PostPage.css';
import AISummaryContent from '../components/AISummaryContent';

interface PostWithSummary extends Post {
  summary?: string;
}

function PostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostWithSummary | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userVote, setUserVote] = useState<number>(0);
  const [commentBody, setCommentBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch post data with AI summary
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      setLoadingSummary(true);
      
      try {
        let data;
        try {
          // Try to fetch post with AI summary (works with both ID and slug)
          data = await postsApi.getWithSummaryByIdOrSlug(id!);
          setLoadingSummary(false);
        } catch (summaryErr) {
          console.log('AI summary endpoint failed, fetching without summary...');
          // Fallback to regular post endpoint
          data = await postsApi.getByIdOrSlug(id!);
          setLoadingSummary(false);
        }

        // Transform post data - backend returns nested objects
        const apiData = data as any; // Type assertion to handle API response
        const transformedPost: PostWithSummary = {
          id: apiData.id,
          slug: apiData.slug || undefined,
          title: apiData.title,
          body: apiData.body || undefined,
          author: apiData.author?.username || 'Unknown',
          communityId: apiData.community?.id || apiData.communityId || 0,
          communityName: apiData.community?.name || apiData.communityName || 'General',
          communitySlug: apiData.community?.slug || apiData.communitySlug,
          voteCount: apiData.voteCount || apiData.vote_count || 0,
          commentCount: apiData.commentCount || apiData.comment_count || 0,
          createdAt: apiData.createdAt || apiData.created_at,
          summary: apiData.ai_summary || undefined,
        };
        
        // Recursive mapper for comments (handles nested replies)
        const mapApiComment = (c: any): Comment => ({
          id: c.id,
          body: c.body,
          author: c.author?.username || 'Unknown',
          postId: c.postId || c.post_id,
          parentCommentId: c.parentCommentId || c.parent_comment_id,
          voteCount: c.vote_count || 0,
          createdAt: c.createdAt || c.created_at,
          replies: Array.isArray(c.replies) ? c.replies.map(mapApiComment) : [],
        });

        // Map comments from backend format (with nested replies)
        let commentsData: Comment[] = [];
        if (apiData.comments && Array.isArray(apiData.comments)) {
          commentsData = apiData.comments.map(mapApiComment);
        }
        
        setPost(transformedPost);
        setComments(commentsData);
      } catch (err: any) {
        console.error('Error fetching post:', err);
        const errorMsg = err.response?.status === 404 
          ? 'Post not found. It may have been deleted or the ID is invalid.'
          : 'Failed to load post. Make sure the backend server is running.';
        setError(errorMsg);
      } finally {
        setLoading(false);
        setLoadingSummary(false);
      }
    };
    
    fetchPost();
  }, [id]);

  const handleVote = async (value: number) => {
    if (!post) return;
    const oldVote = userVote;
    const newVote = oldVote === value ? 0 : value;
    const voteDiff = newVote - oldVote;
    
    // Optimistic update
    setUserVote(newVote);
    setPost({ ...post, voteCount: (post.voteCount || 0) + voteDiff });

    try {
      const { votesApi } = await import('../services/api');
      
      if (newVote === 0) {
        await votesApi.remove('post', post.id);
      } else {
        await votesApi.cast({
          target_type: 'post',
          target_id: post.id,
          value: newVote as 1 | -1,
        });
      }
    } catch (err: any) {
      console.error('Error voting:', err);
      // Revert on error
      setUserVote(oldVote);
      setPost({ ...post, voteCount: (post.voteCount || 0) - voteDiff });
      alert(err.response?.data?.error || 'Failed to vote. Please make sure you are logged in.');
    }
  };

  const handleReply = async (parentCommentId: number, body: string) => {
    if (!post) return;

    try {
      await commentsApi.create({
        postId: post.id,
        body,
        parentCommentId,
      });

      // Refresh comments after reply to show the new reply
      const result = await commentsApi.getByPost(post.id);
      const mapApiComment = (c: any): Comment => ({
        id: c.id,
        body: c.body,
        author: c.author?.username || 'Unknown',
        postId: c.postId,
        parentCommentId: c.parentCommentId,
        voteCount: c.vote_count || 0,
        createdAt: c.createdAt,
        replies: Array.isArray(c.replies) ? c.replies.map(mapApiComment) : [],
      });
      setComments((result.comments || []).map(mapApiComment));
    } catch (err: any) {
      console.error('Error posting reply:', err);
      alert(err.response?.data?.error || 'Failed to post reply. Please make sure you are logged in.');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentBody.trim()) return;
    
    try {
      await commentsApi.create({
        postId: post.id,
        body: commentBody.trim(),
        parentCommentId: undefined, // Top-level comment
      });

      // Refresh comments to show the new comment
      const result = await commentsApi.getByPost(post.id);
      const mapApiComment = (c: any): Comment => ({
        id: c.id,
        body: c.body,
        author: c.author?.username || 'Unknown',
        postId: c.postId,
        parentCommentId: c.parentCommentId,
        voteCount: c.vote_count || 0,
        createdAt: c.createdAt,
        replies: Array.isArray(c.replies) ? c.replies.map(mapApiComment) : [],
      });
      setComments((result.comments || []).map(mapApiComment));
      setPost({ ...post, commentCount: post.commentCount + 1 });
      setCommentBody('');
    } catch (err: any) {
      console.error('Error posting comment:', err);
      alert(err.response?.data?.error || 'Failed to post comment. Please make sure you are logged in.');
    }
  };

  if (loading) {
    return (
      <div className="post-page">
        <div className="post-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-page">
        <div className="post-container">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--blueit-primary)' }}>
            <p>{error || 'Post not found'}</p>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              Make sure your backend server is running on port 5000 and you have added your OpenAI API key.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="post-page">
      <div className="post-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="post-detail">
          <VoteButtons
            voteCount={post.voteCount || 0}
            onUpvote={() => handleVote(1)}
            onDownvote={() => handleVote(-1)}
            userVote={userVote}
          />
          
          <div className="post-main">
            <div className="post-header">
              <div className="post-meta">
                <Link to={`/communities/${post.communityId}`} className="community-link">
                  r/{post.communityName}
                </Link>
                <span className="separator">•</span>
                <span className="author">Posted by u/{post.author}</span>
                <span className="separator">•</span>
                <span className="time">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <h1 className="post-title">
                {post.post_type === 'link' && '🔗 '}
                {post.post_type === 'image' && '🖼️ '}
                {post.post_type === 'video' && '🎥 '}
                {post.post_type === 'poll' && '📊 '}
                {post.post_type === 'crosspost' && '🔄 '}
                {post.title}
              </h1>
            </div>
            
            {/* Post Content based on type */}
            <PostContent post={post} isFullView={true} />
            
            {/* Poll Widget for poll posts */}
            {post.post_type === 'poll' && <PollWidget postId={post.id} />}
            
            {/* AI Summary Box */}
            {post.summary ? (
              <div className="ai-summary-box">
                <div className="ai-summary-header">
                  <span className="ai-icon">✨</span>
                  <span className="ai-label">AI Summary</span>
                  <span className="ai-badge">Powered by GPT-4o-mini</span>
                </div>
                <div className="ai-summary-content">
                  <AISummaryContent content={post.summary} />
                </div>
              </div>
            ) : (
              <div className="ai-summary-box">
                <div className="ai-summary-header">
                  <span className="ai-icon">✨</span>
                  <span className="ai-label">AI Summary</span>
                </div>
                <div className="ai-summary-content">
                  <p style={{ color: '#666', fontStyle: 'italic' }}>
                    {loadingSummary 
                      ? 'Generating AI summary...' 
                      : 'AI summary not available. Make sure your OpenAI API key is configured.'}
                  </p>
                </div>
              </div>
            )}
            
            <div className="post-actions">
              <button className="action-button">
                💬 {post.commentCount} Comments
              </button>
              <button 
                className="action-button"
                onClick={() => {
                  const url = `${window.location.origin}/p/${post.slug || post.id}`;
                  navigator.clipboard.writeText(url);
                  alert('Link copied to clipboard!');
                }}
              >
                🔗 Share
              </button>
              <button 
                className="action-button"
                onClick={() => {
                  const crosspostUrl = `/communities?crosspost=${post.id}`;
                  window.location.href = crosspostUrl;
                }}
              >
                🔄 Crosspost
              </button>
            </div>
          </div>
        </div>

        <div className="comments-section">
          <h2>Comments ({comments.length})</h2>
          
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="What are your thoughts?"
              rows={4}
              className="comment-textarea"
            />
            <div className="comment-actions">
              <button type="submit" className="comment-submit" disabled={!commentBody.trim()}>
                Comment
              </button>
            </div>
          </form>

          <div className="comments-list">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} onReply={handleReply} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostPage;

















