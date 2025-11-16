import { useEffect, useMemo, useState } from 'react';
import { authService } from '../services/auth';
import { usersApi } from '../services/api';
import './SettingsPage.css';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState<string>('');
  const [username, setUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const [postCount, setPostCount] = useState<number>(0);
  const [commentCount, setCommentCount] = useState<number>(0);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const canDelete = useMemo(() => deleteConfirm === 'DELETE', [deleteConfirm]);

  useEffect(() => {
    const init = async () => {
      try {
        // Current user (email, username, createdAt)
        const me = await authService.getCurrentUser();
        setEmail(me.email);
        setUsername(me.username);
        setCreatedAt(me.createdAt);

        // Public profile counts
        const prof = await usersApi.getProfile(me.username);
        setPostCount(prof._count?.posts ?? 0);
        setCommentCount(prof._count?.comments ?? 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const validateUsername = (u: string) => {
    if (!u) return 'Username is required';
    if (!USERNAME_REGEX.test(u)) return '3-20 chars; letters, numbers, underscore only';
    return '';
  };

  const startEdit = () => {
    setEditingUsername(true);
    setNewUsername(username);
    setUsernameError('');
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingUsername(false);
    setNewUsername('');
    setUsernameError('');
  };

  const saveUsername = async () => {
    const err = validateUsername(newUsername.trim());
    if (err) {
      setUsernameError(err);
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const res = await usersApi.updateUsername(newUsername.trim());
      setUsername(res.user.username);
      authService.setUser({ ...authService.getUser(), username: res.user.username });
      setMessage('Username updated successfully');
      setEditingUsername(false);
    } catch (e: any) {
      const apiMsg = e?.response?.data?.error || 'Failed to update username';
      setUsernameError(apiMsg);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!canDelete) return;
    setDeleting(true);
    setMessage('');
    try {
      await usersApi.deleteAccount(deleteConfirm);
      await authService.logout();
      window.location.href = '/auth';
    } catch (e: any) {
      const apiMsg = e?.response?.data?.error || 'Failed to delete account';
      setMessage(apiMsg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="container">
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="container">
        <h1 className="page-title">Account Settings</h1>

        {message && <div className="banner">{message}</div>}

        <section className="card">
          <h2 className="section-title">Profile</h2>
          <div className="row">
            <div className="label">Username</div>
            {!editingUsername ? (
              <div className="value-group">
                <div className="value">u/{username}</div>
                <button className="btn" onClick={startEdit}>Edit</button>
              </div>
            ) : (
              <div className="edit-group">
                <input
                  className={`input ${usernameError ? 'input-error' : ''}`}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="New username"
                  maxLength={20}
                />
                {usernameError && <div className="error-text">{usernameError}</div>}
                <div className="edit-actions">
                  <button className="btn primary" disabled={saving} onClick={saveUsername}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button className="btn" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div className="row">
            <div className="label">Email</div>
            <div className="value">{email}</div>
          </div>

          <div className="row stats">
            <div className="stat">
              <div className="stat-value">{new Date(createdAt).toLocaleDateString()}</div>
              <div className="stat-label">Joined</div>
            </div>
            <div className="stat">
              <div className="stat-value">{postCount}</div>
              <div className="stat-label">Posts</div>
            </div>
            <div className="stat">
              <div className="stat-value">{commentCount}</div>
              <div className="stat-label">Comments</div>
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="section-title">Account Actions</h2>
          <div className="row">
            <button className="btn" disabled title="Not implemented">Change Password</button>
            <button className="btn" disabled title="Not implemented">Change Email</button>
            <button className="btn" onClick={async () => { await authService.logout(); window.location.href = '/auth'; }}>Logout</button>
          </div>
        </section>

        <section className="card danger">
          <h2 className="section-title">Danger Zone</h2>
          <p className="warning">Deleting your account is permanent and cannot be undone. All your posts, comments, and votes will be removed.</p>
          <div className="delete-group">
            <label className="label" htmlFor="deleteConfirm">Type DELETE to confirm</label>
            <input
              id="deleteConfirm"
              className="input"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
            <button className="btn danger-btn" disabled={!canDelete || deleting} onClick={deleteAccount}>
              {deleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
