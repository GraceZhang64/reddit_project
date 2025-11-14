import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VoteButtons from '../components/VoteButtons';
import CommentItem from '../components/CommentItem';
import { Post, Comment } from '../types';

// Helper function to build nested comment tree
function buildCommentTree(comments: Comment[]): Comment[] {
  const commentMap = new Map<number, Comment>();
  const rootComments: Comment[] = [];

  // First pass: create comment objects with replies array
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: build tree structure
  comments.forEach(comment => {
    const commentObj = commentMap.get(comment.id)!;
    if (comment.parentCommentId) {
      const parent = commentMap.get(comment.parentCommentId);
      if (parent && parent.replies) {
        parent.replies.push(commentObj);
      }
    } else {
      rootComments.push(commentObj);
    }
  });

  return rootComments;
}
import './PostPage.css';

const API_URL = 'http://localhost:3001/api';

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
  const [error, setError] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Fetch post data with AI summary
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch post with AI summary
        let response = await fetch(`${API_URL}/posts/${id}/summary`);
        
        // If summary endpoint fails, fall back to regular post endpoint
        if (!response.ok) {
          console.log('AI summary endpoint failed, fetching without summary...');
          response = await fetch(`${API_URL}/posts/${id}`);
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }
        
        const data = await response.json();

        // Transform post data
        const transformedPost: PostWithSummary = {
          id: data.id,
          title: data.title,
          body: data.body,
          author: data.author_id,
          communityId: data.community_id,
          communityName: data.community_name || 'General',
          voteCount: data.vote_count || 0,
          commentCount: data.comment_count || 0,
          createdAt: data.created_at,
          summary: data.ai_summary,
        };
        // Fetch comments from API
        let commentsData: Comment[] = [];
        try {
          const commentsResponse = await fetch(`${API_URL}/comments/posts/${id}`);
          if (commentsResponse.ok) {
            commentsData = await commentsResponse.json();
          } else {
            console.log('Failed to fetch comments, using mock data');
          }
        } catch (err) {
          console.log('Error fetching comments:', err);
        }
        
        setPost(transformedPost);
        setComments(commentsData);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post. Make sure the backend server is running.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [id]);

  const handleVote = (value: number) => {
    if (!post) return;
    const oldVote = userVote;
    const newVote = oldVote === value ? 0 : value;
    const voteDiff = newVote - oldVote;
    
    setUserVote(newVote);
    setPost({ ...post, voteCount: post.voteCount + voteDiff });
  };

  const handleReply = async (parentCommentId: number, body: string) => {
    if (!post) return;

    try {
      const response = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add auth token here
        },
        body: JSON.stringify({
          postId: post.id,
          body,
          parentCommentId,
        }),
      });

      if (response.ok) {
        // Refresh comments after reply
        const commentsResponse = await fetch(`${API_URL}/comments/posts/${id}`);
        if (commentsResponse.ok) {
          const updatedComments = await commentsResponse.json();
          setComments(updatedComments);
        }
      }
    } catch (err) {
      console.error('Error posting reply:', err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentBody.trim()) return;
    
    // Post comment to backend
    try {
      const response = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add auth token
        },
        body: JSON.stringify({
          postId: post.id,
          body: commentBody.trim(),
          parentCommentId: null, // Top-level comment
        }),
      });

      if (response.ok) {
        // Refresh comments
        const commentsResponse = await fetch(`${API_URL}/comments/posts/${id}`);
        if (commentsResponse.ok) {
          const updatedComments = await commentsResponse.json();
          setComments(updatedComments);
          setPost({ ...post, commentCount: post.commentCount + 1 });
        }
      }
    } catch (err) {
      console.error('Error posting comment:', err);
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

















