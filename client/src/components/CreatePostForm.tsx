import { useState } from 'react';
import { Community } from '../types';
import './CreatePostForm.css';

interface CreatePostFormProps {
  communities: Community[];
  onSubmit: (postData: PostData) => void;
  onCancel?: () => void;
  defaultCommunityId?: number;
  crosspostId?: number;
  crosspostTitle?: string;
}

export type PostType = 'text' | 'link' | 'image' | 'video' | 'poll';

export interface PostData {
  title: string;
  body?: string;
  post_type: PostType | 'crosspost';
  link_url?: string;
  image_url?: string;
  video_url?: string;
  media_urls?: string[];
  poll_options?: string[];
  poll_expires_hours?: number;
  crosspost_id?: number;
  community_id: number;
}

function CreatePostForm({ communities, onSubmit, onCancel, defaultCommunityId, crosspostId, crosspostTitle }: CreatePostFormProps) {
  const isCrosspost = !!crosspostId;
  const [postType, setPostType] = useState<PostType>(isCrosspost ? 'text' : 'text');
  const [title, setTitle] = useState(crosspostTitle || '');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string>('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollExpires, setPollExpires] = useState<string>('72');
  const [communityId, setCommunityId] = useState(defaultCommunityId || communities[0]?.id || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const postData: PostData = {
      title: title.trim(),
      post_type: isCrosspost ? 'crosspost' : postType,
      community_id: communityId,
    };

    // Handle crosspost
    if (isCrosspost && crosspostId) {
      postData.crosspost_id = crosspostId;
      postData.body = body.trim(); // Optional comment on crosspost
      onSubmit(postData);
      setTitle('');
      setBody('');
      return;
    }

    // Add type-specific fields
    if (postType === 'text') {
      postData.body = body.trim();
    } else if (postType === 'link') {
      postData.link_url = linkUrl.trim();
      postData.body = body.trim(); // Optional description
    } else if (postType === 'image') {
      postData.image_url = imageUrl.trim();
      if (mediaUrls.trim()) {
        postData.media_urls = mediaUrls.split('\n').map(url => url.trim()).filter(url => url);
      }
      postData.body = body.trim(); // Optional caption
    } else if (postType === 'video') {
      postData.video_url = videoUrl.trim();
      postData.body = body.trim(); // Optional description
    } else if (postType === 'poll') {
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        alert('Please provide at least 2 poll options');
        return;
      }
      postData.poll_options = validOptions.map(opt => opt.trim());
      postData.poll_expires_hours = parseInt(pollExpires) || undefined;
      postData.body = body.trim(); // Optional description
    }

    onSubmit(postData);
    
    // Reset form
    setTitle('');
    setBody('');
    setLinkUrl('');
    setImageUrl('');
    setVideoUrl('');
    setMediaUrls('');
    setPollOptions(['', '']);
    setPollExpires('72');
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  return (
    <form className="create-post-form" onSubmit={handleSubmit}>
      <h2>{isCrosspost ? 'Crosspost to Community' : 'Create a Post'}</h2>
      
      {isCrosspost && (
        <div style={{ 
          padding: '0.75rem', 
          background: 'rgba(74, 144, 226, 0.1)', 
          border: '2px solid var(--blueit-primary)',
          borderRadius: '8px',
          marginBottom: '1rem',
          color: 'var(--blueit-text)'
        }}>
          <strong>🔄 Crossposting:</strong> {crosspostTitle}
        </div>
      )}
      
      {/* Post Type Tabs - Hide for crossposts */}
      {!isCrosspost && (
        <div className="post-type-tabs">
        <button
          type="button"
          className={`tab ${postType === 'text' ? 'active' : ''}`}
          onClick={() => setPostType('text')}
        >
          📝 Text
        </button>
        <button
          type="button"
          className={`tab ${postType === 'link' ? 'active' : ''}`}
          onClick={() => setPostType('link')}
        >
          🔗 Link
        </button>
        <button
          type="button"
          className={`tab ${postType === 'image' ? 'active' : ''}`}
          onClick={() => setPostType('image')}
        >
          🖼️ Image
        </button>
        <button
          type="button"
          className={`tab ${postType === 'video' ? 'active' : ''}`}
          onClick={() => setPostType('video')}
        >
          🎥 Video
        </button>
        <button
          type="button"
          className={`tab ${postType === 'poll' ? 'active' : ''}`}
          onClick={() => setPostType('poll')}
        >
          📊 Poll
        </button>
      </div>
      )}

      {!defaultCommunityId && (
        <div className="form-group">
          <label htmlFor="community-select">Choose a community</label>
          <select
            id="community-select"
            value={communityId}
            onChange={(e) => setCommunityId(Number(e.target.value))}
            className="community-select"
          >
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                c/{community.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="post-title">Title</label>
        <input
          id="post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="An interesting title"
          required
          maxLength={300}
          className="post-title-input"
        />
        <small>{title.length}/300 characters</small>
      </div>

      {/* Crosspost comment field */}
      {isCrosspost && (
        <div className="form-group">
          <label htmlFor="post-body">Add a comment (optional)</label>
          <textarea
            id="post-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add your thoughts about this post..."
            rows={5}
            maxLength={10000}
            className="post-body-textarea"
          />
          <small>{body.length}/10,000 characters</small>
        </div>
      )}

      {/* Type-specific fields */}
      {!isCrosspost && postType === 'text' && (
        <div className="form-group">
          <label htmlFor="post-body">Body (optional)</label>
          <textarea
            id="post-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Text (optional)"
            rows={10}
            maxLength={10000}
            className="post-body-textarea"
          />
          <small>{body.length}/10,000 characters</small>
        </div>
      )}

      {!isCrosspost && postType === 'link' && (
        <>
          <div className="form-group">
            <label htmlFor="link-url">URL *</label>
            <input
              id="link-url"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              required
              className="post-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="post-body">Description (optional)</label>
            <textarea
              id="post-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a description..."
              rows={5}
              maxLength={10000}
              className="post-body-textarea"
            />
          </div>
        </>
      )}

      {!isCrosspost && postType === 'image' && (
        <>
          <div className="form-group">
            <label htmlFor="image-url">Image URL *</label>
            <input
              id="image-url"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              required
              className="post-input"
            />
            <small>Direct link to image (jpg, png, gif, webp)</small>
          </div>
          <div className="form-group">
            <label htmlFor="media-urls">Additional Images (optional)</label>
            <textarea
              id="media-urls"
              value={mediaUrls}
              onChange={(e) => setMediaUrls(e.target.value)}
              placeholder="One URL per line&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
              rows={3}
              className="post-body-textarea"
            />
            <small>Gallery: one URL per line (max 10)</small>
          </div>
          <div className="form-group">
            <label htmlFor="post-body">Caption (optional)</label>
            <textarea
              id="post-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a caption..."
              rows={3}
              maxLength={10000}
              className="post-body-textarea"
            />
          </div>
        </>
      )}

      {!isCrosspost && postType === 'video' && (
        <>
          <div className="form-group">
            <label htmlFor="video-url">Video URL *</label>
            <input
              id="video-url"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or direct video link"
              required
              className="post-input"
            />
            <small>YouTube, Vimeo, or direct video link</small>
          </div>
          <div className="form-group">
            <label htmlFor="post-body">Description (optional)</label>
            <textarea
              id="post-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a description..."
              rows={5}
              maxLength={10000}
              className="post-body-textarea"
            />
          </div>
        </>
      )}

      {!isCrosspost && postType === 'poll' && (
        <>
          <div className="form-group">
            <label>Poll Options (2-6 options)</label>
            {pollOptions.map((option, index) => (
              <div key={index} className="poll-option-row">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updatePollOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  maxLength={200}
                  className="poll-option-input"
                  required
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePollOption(index)}
                    className="remove-option-btn"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 6 && (
              <button type="button" onClick={addPollOption} className="add-option-btn">
                + Add Option
              </button>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="poll-expires">Poll Duration</label>
            <select
              id="poll-expires"
              value={pollExpires}
              onChange={(e) => setPollExpires(e.target.value)}
              className="poll-expires-select"
            >
              <option value="24">1 day</option>
              <option value="72">3 days</option>
              <option value="168">1 week</option>
              <option value="336">2 weeks</option>
              <option value="">Never expires</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="post-body">Description (optional)</label>
            <textarea
              id="post-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add context to your poll..."
              rows={3}
              maxLength={10000}
              className="post-body-textarea"
            />
          </div>
        </>
      )}

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="submit-btn" disabled={!title.trim()}>
          Post
        </button>
      </div>
    </form>
  );
}

export default CreatePostForm;
