import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VoteButtons from '../components/VoteButtons';
import { Post, Comment } from '../types';
import './PostPage.css';

const API_URL = 'http://localhost:5000/api';

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
        // Try to fetch post with AI summary first
        let response = await fetch(`${API_URL}/posts/${id}/summary`);
        
        // If it fails (e.g., quota exceeded), fall back to post without summary
        if (!response.ok) {
          console.log('AI summary failed, fetching post without summary...');
          response = await fetch(`${API_URL}/posts/${id}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch post');
          }
        }
        
        const data = await response.json();
        
        // Transform backend data to match frontend types
        const transformedPost: PostWithSummary = {
          id: data.post.id,
          title: data.post.title,
          body: data.post.body,
          author: data.post.author,
          communityId: data.post.communityId || 1,
          communityName: data.post.communityName,
          voteCount: data.post.voteCount,
          commentCount: data.post.commentCount,
          createdAt: data.post.createdAt,
          summary: data.aiSummary || data.summary,
        };
        
        const transformedComments: Comment[] = data.comments.map((c: any) => ({
          id: c.id,
          body: c.body,
          author: c.author,
          postId: data.post.id,
          voteCount: c.voteCount,
          createdAt: c.createdAt,
        }));
        
        setPost(transformedPost);
        setComments(transformedComments);
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

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentBody.trim()) return;
    
    // For now, just add comment locally (would need backend endpoint for real implementation)
    const newComment: Comment = {
      id: comments.length + 1,
      body: commentBody.trim(),
      author: 'current_user',
      postId: post.id,
      voteCount: 1,
      createdAt: new Date().toISOString(),
    };
    setComments([newComment, ...comments]);
    setCommentBody('');
    setPost({ ...post, commentCount: post.commentCount + 1 });
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
              <CommentCard key={comment.id} comment={comment} />
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
