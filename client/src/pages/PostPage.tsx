import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import VoteButtons from '../components/VoteButtons';
import { Post, Comment } from '../types';
import './PostPage.css';

// Mock data
const mockPost: Post = {
  id: 1,
  title: 'What is your favorite programming language?',
  body: 'I am curious to know what programming languages the community prefers and why. Share your thoughts!\n\nPersonally, I have been enjoying TypeScript lately because of the type safety it provides. It really helps catch bugs early in development and makes refactoring much easier.\n\nWhat about you? What languages do you prefer and why?',
  author: 'john_doe',
  communityId: 1,
  communityName: 'programming',
  voteCount: 15,
  commentCount: 5,
  createdAt: '2025-10-20',
};

const mockComments: Comment[] = [
  {
    id: 1,
    body: 'I love Python for its simplicity and readability! The vast ecosystem of libraries makes it perfect for almost anything.',
    author: 'jane_smith',
    postId: 1,
    voteCount: 8,
    createdAt: '2025-10-20T14:30:00',
  },
  {
    id: 2,
    body: 'TypeScript is amazing! The type safety really helps catch bugs early. I switched from JavaScript last year and never looked back.',
    author: 'bob_wilson',
    postId: 1,
    voteCount: 12,
    createdAt: '2025-10-20T15:45:00',
  },
  {
    id: 3,
    body: 'Rust! The performance is incredible and the borrow checker teaches you to write better code.',
    author: 'alice_dev',
    postId: 1,
    voteCount: 6,
    createdAt: '2025-10-21T09:15:00',
  },
];

function PostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post>(mockPost);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [userVote, setUserVote] = useState<number>(0);
  const [commentBody, setCommentBody] = useState('');

  const handleVote = (value: number) => {
    const oldVote = userVote;
    const newVote = oldVote === value ? 0 : value;
    const voteDiff = newVote - oldVote;
    
    setUserVote(newVote);
    setPost({ ...post, voteCount: post.voteCount + voteDiff });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentBody.trim()) {
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
    }
  };

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
            <div className="ai-summary-box">
              <div className="ai-summary-header">
                <span className="ai-icon">✨</span>
                <span className="ai-label">AI Summary</span>
              </div>
              <div className="ai-summary-content">
                <h4>Key Points:</h4>
                <ul>
                  <li>Community discusses various perspectives on {post.title.toLowerCase()}</li>
                  <li>Users share personal experiences and recommendations</li>
                  <li>Main debate focuses on best practices and trade-offs</li>
                  <li>{post.commentCount} people have contributed to the conversation</li>
                </ul>
                <h4>Top Viewpoints:</h4>
                <p>The discussion highlights different approaches, with users emphasizing practical experience 
                and real-world applications. Common themes include learning resources, common pitfalls, 
                and success stories.</p>
              </div>
            </div>
            
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
