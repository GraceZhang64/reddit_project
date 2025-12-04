import React, { useState } from 'react';
import { Community } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import './CreatePostForm.css';

interface CreatePostFormProps {
  communities: Community[];
  onSubmit: (postData: PostData) => Promise<void>;
  onCancel?: () => void;
  defaultCommunityId?: number;
}

export type PostType = 'text' | 'poll';

export interface PostData {
  title: string;
  body?: string;
  post_type: PostType;
  poll_options?: string[];
  poll_expires_hours?: number;
  community_id: number;
}

function CreatePostForm({ communities, onSubmit, onCancel, defaultCommunityId }: CreatePostFormProps) {
  const [postType, setPostType] = useState<PostType>('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollExpires, setPollExpires] = useState<string>('72');
  const [communityId, setCommunityId] = useState(defaultCommunityId || communities[0]?.id || 1);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setError(null);
    setIsSubmitting(true);

    const postData: PostData = {
      title: title.trim(),
      post_type: postType,
      community_id: communityId,
    };

    // Add type-specific fields
    if (postType === 'text') {
      postData.body = body.trim();
    } else if (postType === 'poll') {
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        setError('Please provide at least 2 poll options');
        setIsSubmitting(false);
        return;
      }
      postData.poll_options = validOptions.map(opt => opt.trim());
      postData.poll_expires_hours = parseInt(pollExpires) || undefined;
      postData.body = body.trim(); // Optional description
    }

    try {
      await onSubmit(postData);
      
      // Reset form on success
      setTitle('');
      setBody('');
      setPollOptions(['', '']);
      setPollExpires('72');
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create post. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
      <h2>Create a Post</h2>
      
      {/* Post Type Tabs */}
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
          className={`tab ${postType === 'poll' ? 'active' : ''}`}
          onClick={() => setPostType('poll')}
        >
          📊 Poll
        </button>
      </div>

      {error && (
        <div className="form-error" style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c33'
        }}>
          {error}
        </div>
      )}

      {!defaultCommunityId && (
        <div className="form-group">
          <label htmlFor="community-select">Choose a community</label>
          <select
            id="community-select"
            value={communityId}
            onChange={(e) => {
              setCommunityId(Number(e.target.value));
              setError(null); // Clear error when changing community
            }}
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

      {/* Type-specific fields */}
      {postType === 'text' && (
        <div className="form-group">
          <div className="textarea-header">
            <label htmlFor="post-body">Body (optional)</label>
            <button
              type="button"
              className={`preview-toggle ${showPreview ? 'active' : ''}`}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? '✏️ Edit' : '👁️ Preview'}
            </button>
          </div>
          {showPreview ? (
            <div className="markdown-preview">
              <div className="preview-header">
                <small>Markdown Preview</small>
              </div>
              <div className="preview-content">
                {body.trim() ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                  >
                    {body}
                  </ReactMarkdown>
                ) : (
                  <em className="preview-placeholder">Nothing to preview</em>
                )}
              </div>
            </div>
          ) : (
            <>
              <textarea
                id="post-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Text (optional) - Markdown supported"
                rows={10}
                maxLength={10000}
                className="post-body-textarea"
              />
              <div className="markdown-help">
                <small>
                  {body.length}/10,000 characters • <a href="https://commonmark.org/help/" target="_blank" rel="noopener noreferrer">Markdown help</a>
                </small>
              </div>
            </>
          )}
        </div>
      )}

      {postType === 'poll' && (
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
        <button type="submit" className="submit-btn" disabled={!title.trim() || isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}

export default CreatePostForm;
