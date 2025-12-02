import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import * as api from '../services/api';

// Mock the API
jest.mock('../services/api');

const mockPosts = [
  {
    id: 1,
    slug: 'test-post-1',
    title: 'Test Post 1',
    body: 'Body 1',
    author: { username: 'user1', id: 'uuid-1', avatar_url: null },
    community: { id: 1, name: 'Community1', slug: 'community1' },
    vote_count: 10,
    comment_count: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    slug: 'test-post-2',
    title: 'Test Post 2',
    body: 'Body 2',
    author: { username: 'user2', id: 'uuid-2', avatar_url: null },
    community: { id: 1, name: 'Community1', slug: 'community1' },
    vote_count: 20,
    comment_count: 3,
    createdAt: new Date().toISOString(),
  },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.postsApi.getHot as jest.Mock).mockResolvedValue({
      posts: mockPosts,
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
  });

  it('should render loading state initially', () => {
    renderWithRouter(<HomePage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render posts after loading', async () => {
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
    });
  });

  it('should display error message on API failure', async () => {
    (api.postsApi.getHot as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load posts/i)).toBeInTheDocument();
    });
  });

  it('should fetch hot posts by default', async () => {
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(api.postsApi.getHot).toHaveBeenCalledWith(1, 20);
    });
  });

  it('should handle empty posts array', async () => {
    (api.postsApi.getHot as jest.Mock).mockResolvedValue({
      posts: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.queryByText('Test Post 1')).not.toBeInTheDocument();
    });
  });
});

