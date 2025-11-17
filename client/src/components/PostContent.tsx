import { Post } from '../types';
import { formatMentions } from '../utils/formatMentions';
import './PostContent.css';

interface PostContentProps {
  post: Post;
  isFullView?: boolean;
}

// Extract YouTube video ID from URL
function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Extract Vimeo video ID from URL
function getVimeoId(url: string): string | null {
  const regExp = /vimeo.*\/(\d+)/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function PostContent({ post, isFullView = false }: PostContentProps) {
  const postType = post.post_type || 'text';

  // Text post
  if (postType === 'text') {
    if (!post.body) return null;
    
    return (
      <div className="post-text-content">
        {isFullView ? (
          post.body.split('\n').map((paragraph, i) => (
            <p key={i}>
              {formatMentions(paragraph).map((part, idx) => (
                <span key={idx}>{part}</span>
              ))}
            </p>
          ))
        ) : (
          <p className="post-preview">
            {formatMentions(
              post.body.length > 300 ? `${post.body.substring(0, 300)}...` : post.body
            ).map((part, idx) => (
              <span key={idx}>{part}</span>
            ))}
          </p>
        )}
      </div>
    );
  }

  // Link post
  if (postType === 'link' && post.link_url) {
    return (
      <div className="post-link-content">
        <a 
          href={post.link_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="link-preview"
        >
          <div className="link-icon">🔗</div>
          <div className="link-info">
            <div className="link-url">{post.link_url}</div>
            <div className="link-domain">{new URL(post.link_url).hostname}</div>
          </div>
          <div className="link-arrow">→</div>
        </a>
        {post.body && (
          <div className="link-description">
            <p>
              {formatMentions(post.body).map((part, idx) => (
                <span key={idx}>{part}</span>
              ))}
            </p>
          </div>
        )}
      </div>
    );
  }


  return null;
}

export default PostContent;

