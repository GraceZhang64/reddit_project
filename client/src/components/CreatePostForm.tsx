import { useState } from 'react';
import { Community } from '../types';
import './CreatePostForm.css';

interface CreatePostFormProps {
  communities: Community[];
  onSubmit: (title: string, body: string, communityId: number) => void;
  onCancel?: () => void;
  defaultCommunityId?: number;
}

function CreatePostForm({ communities, onSubmit, onCancel, defaultCommunityId }: CreatePostFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [communityId, setCommunityId] = useState(defaultCommunityId || communities[0]?.id || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim(), body.trim(), communityId);
      setTitle('');
      setBody('');
    }
  };

  return (
    <form className="create-post-form" onSubmit={handleSubmit}>
      <h2>Create a Post</h2>
      
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
