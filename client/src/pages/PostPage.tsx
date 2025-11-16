import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VoteButtons from '../components/VoteButtons';
import CommentItem from '../components/CommentItem';
import { Post, Comment } from '../types';
import { commentsApi, postsApi } from '../services/api';
import './PostPage.css';

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
        // Support both numeric IDs and slugs
        const postId = parseInt(id!);
        const isNumericId = !isNaN(postId);

        let data;
        try {
          // Try to fetch post with AI summary (works with both ID and slug)
          if (isNumericId) {
            data = await postsApi.getWithSummary(postId);
          } else {
            // Use slug directly
            const response = await fetch(`/api/posts/${id}/summary`);
            if (!response.ok) throw new Error('Failed to fetch');
            data = await response.json();
          }
          setLoadingSummary(false);
        } catch (summaryErr) {
          console.log('AI summary endpoint failed, fetching without summary...');
          // Fallback to regular post endpoint
          if (isNumericId) {
            data = await postsApi.getById(postId);
          } else {
            const response = await fetch(`/api/posts/${id}`);
            if (!response.ok) throw new Error('Failed to fetch');
            data = await response.json();
          }
          setLoadingSummary(false);
        }

        // Transform post data - backend returns nested objects
        const transformedPost: PostWithSummary = {
          id: data.id,
          slug: data.slug || undefined,
          title: data.title,
          body: data.body || undefined,
          author: data.author?.username || 'Unknown',
          communityId: data.community?.id || 0,
          communityName: data.community?.name || 'General',
          communitySlug: data.community?.slug,
          voteCount: data.voteCount || data.vote_count || 0,
          commentCount: data.commentCount || data.comment_count || 0,
          createdAt: data.createdAt || data.created_at,
          summary: data.ai_summary,
        };
        
        // Recursive function to map comments and their nested replies
        const mapComment = (c: any): Comment => ({
          id: c.id,
          body: c.body,
          author: c.author?.username || 'Unknown',
          postId: c.postId || c.post_id,
          parentCommentId: c.parentCommentId || c.parent_comment_id,
          voteCount: c.vote_count || 0,
          createdAt: c.createdAt || c.created_at,
          replies: (c.replies || []).map(mapComment), // Recursively map replies
        });

        // Map comments from backend format
        let commentsData: Comment[] = [];
        if (data.comments && Array.isArray(data.comments)) {
          commentsData = data.comments.map(mapComment);
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
    setPost({ ...post, voteCount: post.voteCount + voteDiff });

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
      setPost({ ...post, voteCount: post.voteCount - voteDiff });
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
      
      // Recursive function to map comments with nested replies
      const mapComment = (c: any): Comment => ({
        id: c.id,
        body: c.body,
        author: c.author?.username || 'Unknown',
        postId: c.postId || c.post_id,
        parentCommentId: c.parentCommentId || c.parent_comment_id,
        voteCount: c.vote_count || 0,
        createdAt: c.createdAt || c.created_at,
        replies: (c.replies || []).map(mapComment), // Recursively map replies
      });

      const mappedComments = (result.comments || []).map(mapComment);
      setComments(mappedComments);
      setPost({ ...post, commentCount: post.commentCount + 1 });
    } catch (err: any) {
      console.error('Error posting reply:', err);
      alert(err.response?.data?.error || 'Failed to post reply. Please make sure you are logged in.');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentBody.trim()) return;
    
    try {
      const newComment = await commentsApi.create({
        postId: post.id,
        body: commentBody.trim(),
        parentCommentId: undefined, // Top-level comment
      });

      // Optimistically add the new comment to the list
      const transformedComment = {
        id: newComment.id,
        body: newComment.body,
        author: newComment.author?.username || 'You',
        postId: post.id,
        parentCommentId: null,
        voteCount: 0,
        createdAt: newComment.createdAt || new Date().toISOString(),
        replies: [],
      };

      setComments([transformedComment, ...comments]);
      setPost({ ...post, commentCount: post.commentCount + 1 });
      setCommentBody('');

      // Refresh in background to get accurate data
      commentsApi.getByPost(post.id).then((result) => {
        setComments(result.comments || []);
      }).catch(console.error);
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
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ff4500' }}>
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
            voteCount={post.voteCount}
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
              <h1 className="post-title">{post.title}</h1>
            </div>
            
            {post.body && (
              <div className="post-body-full">
                {post.body.split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            )}
            
            {/* AI Summary Box */}
            {post.summary ? (
              <div className="ai-summary-box">
                <div className="ai-summary-header">
                  <span className="ai-icon">✨</span>
                  <span className="ai-label">AI Summary</span>
                  <span className="ai-badge">Powered by GPT-4o-mini</span>
                </div>
                <div className="ai-summary-content">
                  {post.summary.split('\n').map((line, i) => {
                    if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                      // Render as heading
                      return <h4 key={i}>{line.replace(/\*\*/g, '')}</h4>;
                    } else if (line.trim().startsWith('-')) {
                      // Render as list item
                      return <li key={i}>{line.substring(1).trim()}</li>;
                    } else if (line.trim()) {
                      // Render as paragraph
                      return <p key={i}>{line}</p>;
                    }
                    return null;
                  })}
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
              <button className="action-button">🔗 Share</button>
              <button className="action-button">💾 Save</button>
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

function CommentCard({ comment }: { comment: Comment }) {
  const [userVote, setUserVote] = useState(0);
  const [voteCount, setVoteCount] = useState(comment.voteCount);

  const handleVote = (value: number) => {
    const oldVote = userVote;
    const newVote = oldVote === value ? 0 : value;
    const voteDiff = newVote - oldVote;
    
    setUserVote(newVote);
    setVoteCount(voteCount + voteDiff);
  };

  return (
    <div className="comment-card">
      <VoteButtons
        voteCount={voteCount}
        onUpvote={() => handleVote(1)}
        onDownvote={() => handleVote(-1)}
        userVote={userVote}
      />
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-author">u/{comment.author}</span>
          <span className="separator">•</span>
          <span className="comment-time">
            {new Date(comment.createdAt).toLocaleString()}
          </span>
        </div>
        <p className="comment-body">{comment.body}</p>
        <div className="comment-actions-bar">
          <button className="comment-action">Reply</button>
          <button className="comment-action">Share</button>
          <button className="comment-action">Report</button>
        </div>
      </div>
    </div>
  );
}

export default PostPage;

















