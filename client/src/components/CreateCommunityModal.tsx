import { useState } from 'react';
import './CreateCommunityModal.css';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
}

function CreateCommunityModal({ isOpen, onClose, onSubmit }: CreateCommunityModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), description.trim());
      setName('');
      setDescription('');
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create a Community</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="community-name">Community Name</label>
            <div className="input-wrapper">
              <span className="prefix">r/</span>
              <input
                id="community-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="programming"
                required
                maxLength={21}
                pattern="[a-zA-Z0-9_]+"
                title="Only letters, numbers, and underscores"
              />
            </div>
            <small>Only letters, numbers, and underscores. Max 21 characters.</small>
          </div>
          <div className="form-group">
            <label htmlFor="community-description">Description</label>
            <textarea
              id="community-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is your community about?"
              rows={4}
              maxLength={500}
            />
            <small>{description.length}/500 characters</small>
          </div>
          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-button">
              Create Community
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCommunityModal;
