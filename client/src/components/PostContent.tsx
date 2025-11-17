import { Post } from '../types';
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
            <p key={i}>{paragraph}</p>
          ))
        ) : (
          <p className="post-preview">
            {post.body.length > 300 ? `${post.body.substring(0, 300)}...` : post.body}
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
            <p>{post.body}</p>
          </div>
        )}
      </div>
    );
  }

  // Image post
  if (postType === 'image' && post.image_url) {
    const allImages = [post.image_url, ...(post.media_urls || [])].filter(Boolean);
    
    return (
      <div className="post-image-content">
        {allImages.length === 1 ? (
          <img src={allImages[0]} alt={post.title} className="post-image" />
        ) : (
          <div className="post-image-gallery">
            {allImages.slice(0, 4).map((url, index) => (
              <div key={index} className="gallery-item">
                <img src={url} alt={`${post.title} - ${index + 1}`} />
                {index === 3 && allImages.length > 4 && (
                  <div className="gallery-overlay">+{allImages.length - 4} more</div>
                )}
              </div>
            ))}
          </div>
        )}
        {post.body && (
          <div className="image-caption">
            <p>{post.body}</p>
          </div>
        )}
      </div>
    );
  }

  // Video post
  if (postType === 'video' && post.video_url) {
    const youtubeId = getYouTubeId(post.video_url);
    const vimeoId = getVimeoId(post.video_url);

    return (
      <div className="post-video-content">
        {youtubeId ? (
          <div className="video-embed">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={post.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : vimeoId ? (
          <div className="video-embed">
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}`}
              title={post.title}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="video-link">
            <a href={post.video_url} target="_blank" rel="noopener noreferrer">
              🎥 Watch Video
            </a>
          </div>
        )}
        {post.body && (
          <div className="video-description">
            <p>{post.body}</p>
          </div>
        )}
      </div>
    );
  }

  // Crosspost
  if (postType === 'crosspost' && post.crosspost) {
    return (
      <div className="post-crosspost-content">
        <div className="crosspost-header">
          <span className="crosspost-icon">🔄</span>
          <span>Crossposted from</span>
          <a href={`/c/${post.crosspost.community.slug}`}>
            c/{post.crosspost.community.name}
          </a>
        </div>
        <div className="crosspost-original">
          <a href={`/p/${post.crosspost.slug || post.crosspost.id}`} className="crosspost-title">
            {post.crosspost.title}
          </a>
          <div className="crosspost-meta">
            by u/{post.crosspost.author.username}
          </div>
        </div>
        {post.body && (
          <div className="crosspost-comment">
            <p>{post.body}</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default PostContent;

